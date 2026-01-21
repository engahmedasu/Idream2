/**
 * Open Graph / meta tags controller for link previews (Facebook, WhatsApp, Twitter, etc.)
 * Returns HTML with og:* and twitter:* meta for crawlers that don't run JavaScript.
 */
const Product = require('../models/Product');
const Shop = require('../models/Shop');

const isProduction = process.env.NODE_ENV === 'production';
const SITE_URL = process.env.SITE_URL || process.env.FRONTEND_PORTAL_URL ||
  (isProduction ? 'https://mall.idreamegypt.com' : 'http://localhost:3000');
const IMAGE_BASE = (process.env.IMAGE_BASE_URL || process.env.API_URL || '').replace(/\/$/, '') ||
  (isProduction ? 'https://api.idreamegypt.com' : 'http://localhost:5000');

const SITE_TITLE = 'iDream Portal';
const SITE_DESCRIPTION = 'iDream Portal - Your shopping destination';
const SITE_IMAGE = `${SITE_URL}/logo.svg`;

function absoluteImage(path) {
  if (!path) return SITE_IMAGE;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

function stripHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function truncate(str, max = 160) {
  const s = stripHtml(str);
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}

function renderHtml({ title, description, image, url, type = 'website', extraMeta = [] }) {
  const escaped = (v) => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    `<title>${escaped(title)}</title>`,
    `<meta property="og:title" content="${escaped(title)}">`,
    `<meta property="og:description" content="${escaped(description)}">`,
    `<meta property="og:image" content="${escaped(image)}">`,
    `<meta property="og:url" content="${escaped(url)}">`,
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="iDream Mall">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escaped(title)}">`,
    `<meta name="twitter:description" content="${escaped(description)}">`,
    `<meta name="twitter:image" content="${escaped(image)}">`,
    `<meta name="description" content="${escaped(description)}">`,
    ...extraMeta,
    '</head><body>',
    `<p>Redirecting to <a href="${escaped(url)}">${escaped(url)}</a></p>`,
    '</body></html>'
  ];
  return lines.join('\n');
}

/**
 * GET /api/meta/og/html?path=/product/123 | /shop/abc | /
 * Serves HTML with og/twitter meta for crawlers. No auth.
 */
exports.getOgHtml = async (req, res) => {
  try {
    const raw = (req.query.path || req.query.pathname || '').replace(/^#.*$/, '');
    const path = raw.split('?')[0].replace(/\/+/g, '/').replace(/^\//, '') || '/';

    // Homepage
    if (path === '' || path === '/') {
      const html = renderHtml({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        image: SITE_IMAGE,
        url: SITE_URL
      });
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // /product/:id
    const productMatch = path.match(/^product\/([^/]+)/);
    if (productMatch) {
      const id = productMatch[1];
      const product = await Product.findById(id).populate('shop', 'name').populate('category', 'name');
      if (!product) {
        const html = renderHtml({
          title: 'Not Found',
          description: 'Product not found',
          image: SITE_IMAGE,
          url: `${SITE_URL}/product/${id}`
        });
        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.status(404).send(html);
      }
      const url = `${SITE_URL}/product/${id}`;
      const desc = truncate(product.description, 160);
      const extra = [
        `<meta property="product:price:amount" content="${Number(product.price) || 0}">`,
        `<meta property="product:price:currency" content="EGP">`
      ];
      const html = renderHtml({
        title: product.name,
        description: desc || `${product.name} - ${product.shop?.name || ''} at iDream Mall`.trim(),
        image: absoluteImage(product.image),
        url,
        type: 'product',
        extraMeta: extra
      });
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // /shop/:shareLink
    const shopMatch = path.match(/^shop\/([^/]+)/);
    if (shopMatch) {
      const shareLink = shopMatch[1];
      const shop = await Shop.findOne({ shareLink }).populate('category', 'name');
      if (!shop) {
        const html = renderHtml({
          title: 'Not Found',
          description: 'Shop not found',
          image: SITE_IMAGE,
          url: `${SITE_URL}/shop/${shareLink}`
        });
        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.status(404).send(html);
      }
      const url = `${SITE_URL}/shop/${shareLink}`;
      const desc = `${shop.name}${shop.category?.name ? ` - ${shop.category.name}` : ''} - Shop at iDream Mall`;
      const html = renderHtml({
        title: shop.name,
        description: desc,
        image: absoluteImage(shop.image),
        url
      });
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Unsupported path: fallback to site defaults
    const html = renderHtml({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      image: SITE_IMAGE,
      url: `${SITE_URL}/${path}`
    });
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(renderHtml({
      title: 'Error',
      description: 'Unable to load preview',
      image: SITE_IMAGE,
      url: SITE_URL
    }));
  }
};
