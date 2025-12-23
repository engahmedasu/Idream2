const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth); // All report routes require authentication

router.get('/shops', authorize('superAdmin', 'mallAdmin'), reportController.generateShopsReport);
router.get('/products', authorize('superAdmin', 'mallAdmin', 'shopAdmin'), reportController.generateProductsReport);
router.get('/shares', authorize('superAdmin', 'mallAdmin'), reportController.generateShareReport);
router.get('/orders', authorize('superAdmin', 'mallAdmin'), reportController.generateOrderReport);
router.get('/subscription-logs', authorize('superAdmin'), reportController.generateSubscriptionLogsReport);

module.exports = router;

