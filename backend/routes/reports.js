const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, authorize, checkPermission } = require('../middleware/auth');

router.use(auth); // All report routes require authentication

// All report routes use permission-based authorization - requires report.read permission
router.get('/shops', checkPermission('report', 'read'), reportController.generateShopsReport);
router.get('/products', checkPermission('report', 'read'), reportController.generateProductsReport);
router.get('/shares', checkPermission('report', 'read'), reportController.generateShareReport);
router.get('/orders', checkPermission('report', 'read'), reportController.generateOrderReport);
router.get('/subscription-logs', checkPermission('report', 'read'), reportController.generateSubscriptionLogsReport);

module.exports = router;

