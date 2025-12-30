const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Public route - submit contact request
router.post('/', contactController.submitContactRequest);

// Admin routes - require authentication and superAdmin role
router.get('/', auth, authorize('superAdmin'), contactController.getAllContactRequests);
router.get('/stats', auth, authorize('superAdmin'), contactController.getStatistics);
router.get('/:id', auth, authorize('superAdmin'), contactController.getContactRequestById);
router.patch('/:id/read', auth, authorize('superAdmin'), contactController.markAsRead);
router.patch('/:id/status', auth, authorize('superAdmin'), contactController.updateStatus);
router.delete('/:id', auth, authorize('superAdmin'), contactController.deleteContactRequest);

module.exports = router;

