const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route - Get active advertisements for frontend
router.get('/active', advertisementController.getActiveAdvertisements);

// Admin routes - require authentication and superAdmin role
router.get('/', auth, authorize('superAdmin'), advertisementController.getAllAdvertisements);
router.get('/:id', auth, authorize('superAdmin'), advertisementController.getAdvertisementById);
router.post('/', auth, authorize('superAdmin'), upload.single('advertisementImage'), advertisementController.createAdvertisement);
router.put('/:id', auth, authorize('superAdmin'), upload.single('advertisementImage'), advertisementController.updateAdvertisement);
router.delete('/:id', auth, authorize('superAdmin'), advertisementController.deleteAdvertisement);
router.patch('/:id/toggle-status', auth, authorize('superAdmin'), advertisementController.toggleAdvertisementStatus);

module.exports = router;
