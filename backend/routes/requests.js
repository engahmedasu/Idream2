const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { documentUpload } = require('../middleware/upload');

// Public route - submit request (with optional document upload)
router.post('/', documentUpload.single('document'), requestController.submitRequest);

// Admin routes - require authentication and superAdmin role
router.get('/', auth, authorize('superAdmin'), requestController.getAllRequests);
router.get('/stats', auth, authorize('superAdmin'), requestController.getStatistics);
router.get('/:id', auth, authorize('superAdmin'), requestController.getRequestById);
router.patch('/:id/read', auth, authorize('superAdmin'), requestController.markAsRead);
router.patch('/:id/status', auth, authorize('superAdmin'), requestController.updateStatus);
router.delete('/:id', auth, authorize('superAdmin'), requestController.deleteRequest);

module.exports = router;
