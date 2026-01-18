import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiMessageCircle } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import getImageUrl, { handleImageError } from '../utils/imageUrl';
import formatCurrency from '../utils/formatCurrency';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/reviews/product/${id}`);
      setReviews(response.data);
      
      // Check if current user has already reviewed this product
      if (user && response.data.reviews) {
        const userReview = response.data.reviews.find(
          review => review.user?._id === user._id || review.user === user._id
        );
        setUserHasReviewed(!!userReview);
      } else {
        setUserHasReviewed(false);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product._id, quantity);
      toast.success('Product added to cart');
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (userHasReviewed) {
      toast.error('You have already reviewed this product. You can only submit one review per product.');
      return;
    }

    try {
      await api.post(`/reviews/product/${id}`, reviewForm);
      toast.success('Review submitted successfully');
      setReviewForm({ rating: 5, comment: '' });
      setUserHasReviewed(true);
      fetchReviews();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <div className="product-detail loading">Loading...</div>;
  }

  if (!product) {
    return <div className="product-detail">Product not found</div>;
  }

  const shop = product.shop;

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        <div className="product-main">
          <div className="product-image-section">
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              onError={handleImageError}
            />
          </div>

          <div className="product-info-section">
            <h1>{product.name}</h1>
            <p className="product-price">{formatCurrency(product.price)}</p>
            {product.isHotOffer && <span className="hot-badge">Hot Offer</span>}

            <div className="product-shop-info">
              <h3>Shop: {shop?.name}</h3>
              {shop?.whatsapp && (
                <a
                  href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}`}
                  className="whatsapp-contact"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiMessageCircle /> Contact Shop via WhatsApp
                </a>
              )}
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <FiShoppingCart /> Add to Cart
              </button>
            </div>

            {product.shippingTitle && (
              <div className="product-section">
                <h3>{product.shippingTitle}</h3>
                <p>{product.shippingDescription}</p>
              </div>
            )}

            {product.warrantyTitle && (
              <div className="product-section">
                <h3>{product.warrantyTitle}</h3>
                <p>{product.warrantyDescription}</p>
              </div>
            )}
          </div>
        </div>

        <div className="product-reviews">
          <h2>Reviews</h2>
          {reviews && (
            <div className="reviews-summary">
              <div className="average-rating">
                <FiStar />
                <span>{reviews.averageRating.toFixed(1)}</span>
                <span>({reviews.totalReviews} reviews)</span>
              </div>
            </div>
          )}

          {user && !userHasReviewed && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <h3>Write a Review</h3>
              <div className="rating-input">
                <label>Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-button ${star <= (hoveredRating || reviewForm.rating) ? 'active' : ''}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <FiStar />
                    </button>
                  ))}
                  <span className="rating-text">
                    {hoveredRating || reviewForm.rating} {hoveredRating || reviewForm.rating === 1 ? 'Star' : 'Stars'}
                  </span>
                </div>
              </div>
              <textarea
                placeholder="Write your review..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows="4"
              />
              <button type="submit">Submit Review</button>
            </form>
          )}

          {reviews && reviews.reviews.length > 0 && (
            <div className="reviews-list">
              {reviews.reviews.map(review => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <span className="review-user">{review.user?.email || 'Anonymous'}</span>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={i < review.rating ? 'filled' : ''}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

