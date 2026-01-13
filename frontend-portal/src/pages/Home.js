import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiZap, FiChevronLeft, FiChevronRight, FiShoppingCart, FiShoppingBag, FiPackage, FiShare2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ShopCard from '../components/ShopCard';
import ProductCard from '../components/ProductCard';
import VideoBanner from '../components/VideoBanner';
import Advertisement from '../components/Advertisement';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import getImageUrl, { handleImageError } from '../utils/imageUrl';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [hotOffers, setHotOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [firstCategory, setFirstCategory] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef(null);
  const searchQuery = searchParams.get('search');

  const fetchData = useCallback(async () => {
    try {
      // Build API URLs with search query if present
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const [shopsRes, hotOffersRes, productsRes, categoriesRes] = await Promise.all([
        api.get(`/shops?isActive=true${searchParam}`),
        searchQuery ? Promise.resolve({ data: [] }) : api.get('/products/hot-offers?limit=20').catch(() => ({ data: [] })), // Only show hot offers when not searching
        api.get(`/products?isActive=true&sortBy=priority${searchParam}`).catch(() => ({ data: [] })),
        searchQuery ? Promise.resolve({ data: [] }) : api.get('/categories?isActive=true').catch(() => ({ data: [] })) // Fetch categories for welcome banner
      ]);

      setShops(shopsRes.data);
      setHotOffers(hotOffersRes.data);
      setProducts(productsRes.data || []);
      // Get the first category (sorted by order on backend)
      if (categoriesRes.data && categoriesRes.data.length > 0) {
        setFirstCategory(categoriesRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
    
    // Refresh data every 2 minutes (reduced from 30 seconds) to get updates from admin portal
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 120000); // 2 minutes

    // Refresh when window regains focus (with debounce to prevent multiple calls)
    let focusTimeout;
    const handleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        fetchData();
      }, 1000); // Wait 1 second after focus to avoid rapid calls
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  // Carousel navigation functions
  const itemsPerView = 3;
  const maxSlide = Math.max(0, Math.ceil(hotOffers.length / itemsPerView) - 1);

  const goToSlide = (index) => {
    if (index < 0) index = 0;
    if (index > maxSlide) index = maxSlide;
    setCurrentSlide(index);
    
    if (carouselRef.current) {
      const firstCard = carouselRef.current.querySelector('.hot-offer-card');
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 24; // 1.5rem = 24px
        const scrollPosition = index * (cardWidth + gap) * itemsPerView;
        carouselRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const nextSlide = () => {
    if (currentSlide < maxSlide) {
      goToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  // Touch/Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Update current slide based on scroll position
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.hot-offer-card')?.offsetWidth || 380;
      const gap = 24;
      const newSlide = Math.round(carouselRef.current.scrollLeft / ((cardWidth + gap) * itemsPerView));
      setCurrentSlide(Math.max(0, Math.min(newSlide, maxSlide)));
    }
  };

  const handleAddHotOfferToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(productId, 1);
      toast.success('Product added to cart');
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const handleShareHotOffer = async (e, offer) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/product/${offer._id}`;
    const title = offer.name;
    const text = offer.description || offer.name;

    // Log share action (fire-and-forget)
    try {
      await api.post('/shares', {
        type: 'product',
        itemId: offer._id,
        itemName: offer.name,
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

  // Update slide on scroll
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const firstCard = carousel.querySelector('.hot-offer-card');
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 24;
        const newSlide = Math.round(carousel.scrollLeft / ((cardWidth + gap) * itemsPerView));
        setCurrentSlide(Math.max(0, Math.min(newSlide, maxSlide)));
      }
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, [hotOffers.length, maxSlide, itemsPerView]);

  return (
    <div className="home">
      <div className="home-wrapper">
        {/* Left Advertisement */}
        <Advertisement categoryId={firstCategory?._id} side="left" />
        
        <div className="home-container">
        {/* Video Banner Section */}
        {!searchQuery && <VideoBanner categoryId={firstCategory?._id} />}

        {/* Welcome Section */}
        {!searchQuery && firstCategory && (
          <section className="welcome-banner">
            <h1 className="welcome-title">
              {t('home.welcomeTitle')} <span className="highlight">{firstCategory.name}</span>
            </h1>
            {firstCategory.description && (
              <p className="welcome-tagline">{firstCategory.description}</p>
            )}
          </section>
        )}

        {/* Hot Offers Section */}
        {hotOffers.length > 0 && (
          <section className="hot-offers-section">
            <div className="section-header">
              <FiZap className="flame-icon" />
              <h2>{t('home.hotOffers')}</h2>
            </div>
            <div className="carousel-wrapper">
              {currentSlide > 0 && (
                <button 
                  className="carousel-nav carousel-nav-prev" 
                  onClick={prevSlide}
                  aria-label="Previous slide"
                >
                  <FiChevronLeft />
                </button>
              )}
              <div 
                className="hot-offers-carousel"
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {hotOffers.map((offer) => (
                  <Link
                    key={offer._id}
                    to={`/product/${offer._id}`}
                    className="hot-offer-card"
                    onClick={(e) => {
                      if (isDragging) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="offer-image">
                      <img
                        src={getImageUrl(offer.image)}
                        alt={offer.name}
                        onError={handleImageError}
                      />
                      <span className="sponsored-badge">Special Deal</span>
                    </div>
                    <div className="offer-content">
                      <h3 className="offer-title">{offer.name}</h3>
                      <div className="product-rating hot-offer-rating">
                        <span className="star">★</span>
                        <span className="rating">
                          {(() => {
                            const totalReviews = offer.totalReviews || 0;
                            const avgRating = typeof offer.averageRating === 'number' ? offer.averageRating : 0;
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
                      {typeof offer.price === 'number' && (
                        <div className="offer-price">
                          EGP {offer.price}
                        </div>
                      )}
                      <div className="offer-store">
                        <div className="store-info">
                          <span className="store-name">{offer.shop?.name || 'Store'}</span>
                        </div>
                        <div className="offer-actions">
                          <button
                            type="button"
                            className="share-btn"
                            onClick={(e) => handleShareHotOffer(e, offer)}
                            aria-label="Share product"
                          >
                            <FiShare2 />
                          </button>
                          <button
                            type="button"
                            className="add-to-cart-btn"
                            onClick={(e) => handleAddHotOfferToCart(e, offer._id)}
                            aria-label="Add to cart"
                          >
                            <FiShoppingCart />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {currentSlide < maxSlide && (
                <button 
                  className="carousel-nav carousel-nav-next" 
                  onClick={nextSlide}
                  aria-label="Next slide"
                >
                  <FiChevronRight />
                </button>
              )}
            </div>
            {hotOffers.length > itemsPerView && (
              <div className="carousel-dots">
                {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                  <button
                    key={index}
                    className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Shops Grid */}
        {!searchQuery && (
          <section className="shops-section">
            <div className="section-header">
              <FiShoppingBag className="section-icon" />
              <h2>{t('home.featuredShops')}</h2>
            </div>
            <div className="shops-grid">
              {shops.map(shop => (
                <ShopCard key={shop._id} shop={shop} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        {!searchQuery && (
          <section className="products-section">
            <div className="section-header featured-products-header">
              <FiPackage className="section-icon" />
              <h2>{t('home.featuredProducts')}</h2>
            </div>
            <div className="products-grid">
              {products
                .filter(product => !product.isHotOffer) // Exclude hot offers from featured products
                .slice(0, 8)
                .map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              {products.filter(product => !product.isHotOffer).length === 0 && (
                <div className="no-products-message">
                  <p>{t('home.noProducts') || 'No products available at the moment'}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Search Results */}
        {searchQuery && (
          <section className="search-results">
            <div className="search-results-header">
              <h2>{t('home.searchResults')} "{searchQuery}"</h2>
              <p>
                {shops.length} {t('home.shopsFound')}, {products.length} {t('home.productsFound') || 'products found'}
              </p>
            </div>
            
            {shops.length > 0 && (
              <div className="search-shops-section">
                <h3>{t('home.shops') || 'Shops'}</h3>
                <div className="shops-grid">
                  {shops.map(shop => (
                    <ShopCard key={shop._id} shop={shop} />
                  ))}
                </div>
              </div>
            )}
            
            {products.length > 0 && (
              <div className="search-products-section">
                <h3>{t('home.products') || 'Products'}</h3>
                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            )}
            
            {shops.length === 0 && products.length === 0 && (
              <div className="no-search-results">
                <p>{t('home.noResults') || 'No results found'}</p>
              </div>
            )}
          </section>
        )}
        </div>
        
        {/* Right Advertisement */}
        <Advertisement key="ad-right" categoryId={firstCategory?._id} side="right" />
      </div>
    </div>
  );
};

export default Home;
