const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth, optionalAuth } = require('../middleware/auth');

// Public route
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes - use optionalAuth to allow guest users
router.post('/product/:productId', optionalAuth, reviewController.createReview);
router.put('/:id', auth, reviewController.updateReview);
router.delete('/:id', auth, reviewController.deleteReview);

module.exports = router;

