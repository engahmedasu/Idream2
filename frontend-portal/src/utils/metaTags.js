/**
 * Open Graph and Twitter Card meta tags for link previews (Facebook, WhatsApp, Twitter, etc.)
 */

/**
 * Ensure URL is absolute (has protocol).
 * @param {string} url
 * @param {string} [base=window.location.origin]
 * @returns {string}
 */
function toAbsoluteUrl(url, base = typeof window !== 'undefined' ? window.location.origin : '') {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Update or create a meta tag by property (og:*) or name (twitter:*, description).
 * @param {string} prop - attribute name: "property" or "name"
 * @param {string} key - e.g. "og:title" or "twitter:card"
 * @param {string} content
 */
function setMeta(prop, key, content) {
  if (typeof document === 'undefined' || !key || content == null) return;
  let el = document.querySelector(`meta[${prop}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(prop, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', String(content));
}

/**
 * Update page meta for link previews and document.title.
 * @param {Object} opts
 * @param {string} opts.title - Page title
 * @param {string} [opts.description] - Short description
 * @param {string} [opts.image] - Absolute or relative image URL
 * @param {string} [opts.url] - Canonical URL (default: window.location.href)
 * @param {string} [opts.type='website'] - og:type (e.g. 'website', 'product')
 * @param {string} [opts.siteName='iDream Mall']
 * @param {string} [opts.priceAmount] - product:price:amount (for og:type=product)
 * @param {string} [opts.priceCurrency='EGP'] - product:price:currency
 */
export function updateMetaTags(opts) {
  if (!opts || typeof document === 'undefined') return;
  const {
    title,
    description = '',
    image = '',
    url = typeof window !== 'undefined' ? window.location.href : '',
    type = 'website',
    siteName = 'iDream Mall',
    priceAmount,
    priceCurrency = 'EGP'
  } = opts;

  const imageUrl = toAbsoluteUrl(image);

  // document.title
  if (title) document.title = title;

  // Open Graph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:image', imageUrl);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:site_name', siteName);
  if (imageUrl) {
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
  }

  // Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', imageUrl);

  // Standard description
  setMeta('name', 'description', description);

  // Product-only
  if (type === 'product' && priceAmount != null) {
    setMeta('property', 'product:price:amount', String(priceAmount));
    setMeta('property', 'product:price:currency', priceCurrency);
  }
}

export default updateMetaTags;
