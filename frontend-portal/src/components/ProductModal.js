import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiStar, FiShoppingCart, FiTruck, FiShield } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import getImageUrl, { handleImageError } from '../utils/imageUrl';
import { toast } from 'react-toastify';
import CachedImage from './CachedImage';
import './ProductModal.css';

const ProductModal = ({ productId, onClose }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/reviews/product/${productId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchReviews();
    }
  }, [productId, fetchProduct, fetchReviews]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error(t('cart.loginRequired'));
      navigate('/login');
      return;
    }

    try {
      await addToCart(product._id, 1);
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (!productId || loading) {
    return null;
  }

  if (!product) {
    return (
      <div className="product-modal-overlay" onClick={onClose}>
        <div className="product-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
          <div className="modal-error">{t('common.error')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="product-modal-content">
          <div className="product-modal-image">
            <CachedImage
              src={product.image}
              alt={product.name}
            />
          </div>

          <div className="product-modal-info">
            <span className="product-category">{product.category?.name?.toUpperCase() || 'PRODUCT'}</span>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-rating">
              <FiStar className="star-icon" />
              <span className="rating-value">
                {(() => {
                  const totalReviews = product.totalReviews || 0;
                  const avgRating = typeof product.averageRating === 'number' ? product.averageRating : 0;
                  // Display the actual rating from the backend
                  if (totalReviews > 0 && avgRating > 0) {
                    return avgRating.toFixed(1);
                  }
                  // If no reviews or no rating, show 0 or default
                  return avgRating > 0 ? avgRating.toFixed(1) : '0.0';
                })()}
              </span>
              <span className="rating-count">
                ({product.totalReviews || 0} {t('product.rating') || 'reviews'})
              </span>
            </div>

            <div className="product-price">EGP {product.price}</div>
            <div className="product-shipping">
              {(!product.shippingFees || product.shippingFees === 0)
                ? (t('product.freeShipping') || 'Free Shipping')
                : `${t('product.shippingFees') || 'Shipping Fees'}: EGP ${product.shippingFees}`}
            </div>

            <p className="product-description">{product.description}</p>

            <div className="product-features">
              {product.shippingTitle && (
                <div className="feature-item">
                  <div className="feature-icon shipping">
                    <FiTruck />
                  </div>
                  <div className="feature-text">
                    <div className="feature-title">{product.shippingTitle || t('product.freeShipping')}</div>
                    <div className="feature-desc">{product.shippingDescription || t('product.onOrdersOver')}</div>
                  </div>
                </div>
              )}
              {product.warrantyTitle && (
                <div className="feature-item">
                  <div className="feature-icon warranty">
                    <FiShield />
                  </div>
                  <div className="feature-text">
                    <div className="feature-title">{product.warrantyTitle || t('product.warranty')}</div>
                    <div className="feature-desc">{product.warrantyDescription || t('product.fullCoverage')}</div>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-add-to-cart" onClick={handleAddToCart}>
              <FiShoppingCart />
              {t('product.addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
