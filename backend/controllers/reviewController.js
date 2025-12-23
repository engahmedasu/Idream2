const Review = require('../models/Review');
const Product = require('../models/Product');

// Helper: recalculate and store product average rating
const recalculateProductRating = async (productId) => {
  const reviews = await Review.find({
    product: productId,
    isActive: true
  });

  const totalReviews = reviews.length;
  
  // If reviews exist, calculate actual average (no minimum applied)
  // If no reviews, use 2.5 as default minimum
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews  // Actual average when reviews exist
    : 2.5;  // Default to 2.5 only when no reviews

  // Store in database
  await Product.findByIdAndUpdate(productId, {
    averageRating,
    totalReviews
  });

  return { averageRating, totalReviews };
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isActive: true
    })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    // Calculate average rating
    // If reviews exist, show actual average; if no reviews, show minimum 2.5
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length  // Actual average when reviews exist
      : 2.5;  // Minimum 2.5 only when no reviews

    res.json({ reviews, averageRating: avgRating, totalReviews: reviews.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create review
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Only allow guest users and SuperAdmin to create reviews
    const userRole = req.user.role?.name || '';
    if (userRole !== 'guest' && userRole !== 'superAdmin') {
      return res.status(403).json({ 
        message: 'Only guest users and SuperAdmin can create reviews' 
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id
    });

    if (existingReview) {
      // User has already reviewed this product - prevent duplicate reviews
      return res.status(400).json({ 
        message: 'You have already reviewed this product. You can only submit one review per product.' 
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      rating,
      comment: comment || ''
    });

    await review.populate('user', 'email');

    // Recalculate and persist product rating
    await recalculateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment !== undefined ? req.body.comment : review.comment;
    await review.save();

    await review.populate('user', 'email');

    // Recalculate and persist product rating
    await recalculateProductRating(review.product);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate and persist product rating
    await recalculateProductRating(productId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

