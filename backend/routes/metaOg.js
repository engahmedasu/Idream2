const express = require('express');
const router = express.Router();
const metaOgController = require('../controllers/metaOgController');

/**
 * GET /api/meta/og/html?path=/product/:id | /shop/:shareLink | /
 * Returns HTML with Open Graph and Twitter Card meta for link previews.
 * Intended for crawlers (facebookexternalhit, Twitterbot, WhatsApp, etc.).
 * No authentication.
 */
router.get('/og/html', metaOgController.getOgHtml);

module.exports = router;
