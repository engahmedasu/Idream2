import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import getImageUrl from '../utils/imageUrl';
import formatCurrency from '../utils/formatCurrency';
import { preloadMedia } from '../utils/mediaCache';
import CachedImage from './CachedImage';
import './HeroCarousel.css';

const HeroCarousel = ({ categoryId }) => {
  const [hotOffers, setHotOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotOffers();
  }, [categoryId]);

  useEffect(() => {
    if (hotOffers.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % hotOffers.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hotOffers.length]);

  const fetchHotOffers = async () => {
    try {
      const params = categoryId ? { category: categoryId, limit: 5 } : { limit: 5 };
      const response = await api.get('/products/hot-offers', { params });
      setHotOffers(response.data);
      
      // Preload images in background
      const imageUrls = response.data
        .map(offer => offer.image ? getImageUrl(offer.image) : null)
        .filter(Boolean);
      
      if (imageUrls.length > 0) {
        preloadMedia(imageUrls).catch(err => {
          console.warn('Failed to preload hero carousel images:', err);
        });
      }
    } catch (error) {
      console.error('Error fetching hot offers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || hotOffers.length === 0) {
    return null;
  }

  const currentOffer = hotOffers[currentIndex];

  return (
    <div className="hero-carousel">
      <Link to={`/product/${currentOffer._id}`} className="carousel-slide">
        <div className="carousel-image">
          <CachedImage src={currentOffer.image} alt={currentOffer.name} />
        </div>
        <div className="carousel-content">
          <h2>{currentOffer.name}</h2>
          <p className="carousel-price">{formatCurrency(currentOffer.price)}</p>
          <span className="hot-offer-badge">Hot Offer</span>
        </div>
      </Link>

      {hotOffers.length > 1 && (
        <>
          <div className="carousel-indicators">
            {hotOffers.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
          <button
            className="carousel-nav prev"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + hotOffers.length) % hotOffers.length)}
          >
            ‹
          </button>
          <button
            className="carousel-nav next"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % hotOffers.length)}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

export default HeroCarousel;

