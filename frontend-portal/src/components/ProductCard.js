import React, { useState } from 'react';
import { FiShoppingCart, FiShare2 } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import getImageUrl from '../utils/imageUrl';
import ProductModal from './ProductModal';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product._id, 1);
      toast.success('Product added to cart');
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/product/${product._id}`;
    const title = product.name;
    const text = product.description || product.name;

    // Log share action (fire-and-forget)
    try {
      await api.post('/shares', {
        type: 'product',
        itemId: product._id,
        itemName: product.name,
        channel: navigator.share ? 'web_share' : 'copy_link'
      });
    } catch (err) {
      console.error('Failed to log product share', err);
    }

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Product link copied to clipboard');
      } else {
        toast.info(url);
      }
    } catch {
      // user cancelled share
    }
  };

  return (
    <>
      <div className="product-card" onClick={handleCardClick}>
        <div className="product-image">
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          {product.isHotOffer && <span className="hot-badge">Hot Offer</span>}
        </div>
        <div className="product-info">
          <span className="product-category">{product.category?.name?.toUpperCase() || 'PRODUCT'}</span>
          <h3 className="product-name">{product.name}</h3>
          <div className="product-rating">
            <span className="star">★</span>
            <span className="rating">
              {(() => {
                const totalReviews = product.totalReviews || 0;
                const avgRating = typeof product.averageRating === 'number' ? product.averageRating : 0;
                // Calculate: sum of stars / number of reviews
                // If calculated average < 2.5, display 2.5 as minimum
                // If no reviews, show 2.5
                if (totalReviews > 0) {
                  return Math.max(2.5, avgRating).toFixed(1);
                }
                return '2.5';
              })()}
            </span>
          </div>
          <div className="product-footer">
            <span className="product-price">EGP {product.price}</span>
            <div className="product-actions">
              <button
                className="share-btn"
                onClick={handleShare}
                aria-label="Share product"
              >
                <FiShare2 />
              </button>
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                aria-label="Add to cart"
              >
                <FiShoppingCart />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <ProductModal productId={product._id} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default ProductCard;
