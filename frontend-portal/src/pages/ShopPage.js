import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiShare2, FiMapPin } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaGlobe } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import ProductGrid from '../components/ProductGrid';
import api from '../utils/api';
import getImageUrl, { handleImageError } from '../utils/imageUrl';
import './ShopPage.css';

const ShopPage = () => {
  const { shareLink } = useParams();
  const { t } = useTranslation();
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProductType, setSelectedProductType] = useState('all');

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/shops/share/${shareLink}`);
      setShopData(response.data);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  }, [shareLink]);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  if (loading) {
    return <div className="shop-page loading">Loading...</div>;
  }

  if (!shopData) {
    return <div className="shop-page">Shop not found</div>;
  }

  const { shop, products } = shopData;

  const handleShare = async () => {
    const url = `${window.location.origin}/shop/${shop.shareLink}`;
    const title = shop.name;
    const text = `${shop.name} - ${shop.category?.name || ''}`.trim();

    // Log share action (fire-and-forget)
    try {
      await api.post('/shares', {
        type: 'shop',
        itemId: shop._id,
        itemName: shop.name,
        channel: navigator.share ? 'web_share' : 'copy_link'
      });
    } catch (err) {
      console.error('Failed to log shop share', err);
    }

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success(t('common.linkCopied') || 'Link copied to clipboard');
      } else {
        toast.info(url);
      }
    } catch {
      // user cancelled share; no need to show error
    }
  };


  const handleLocationClick = () => {
    if (shop.address) {
      // Open Google Maps with the address
      const encodedAddress = encodeURIComponent(shop.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  // Filter products by productType if selected
  const filteredProducts = (products || []).filter(product => {
    if (selectedProductType === 'all') {
      return true;
    }
    return product.productType === selectedProductType;
  });

  // Order products: hot offers first, then others (while preserving priority order within each group)
  const orderedProducts = filteredProducts.slice().sort((a, b) => {
    const aHot = a.isHotOffer ? 1 : 0;
    const bHot = b.isHotOffer ? 1 : 0;

    if (aHot !== bHot) {
      // Hot offers first
      return bHot - aHot;
    }

    // Then by priority (higher first), then by createdAt (newer first) if available
    const aPriority = typeof a.priority === 'number' ? a.priority : 0;
    const bPriority = typeof b.priority === 'number' ? b.priority : 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return 0;
  });

  const productTypes = shop?.productTypes || [];

  return (
    <div className="shop-page">
      <div className="shop-page-container">
        <div className="shop-hero">
          <div className="shop-image-banner">
            <img
              src={shop.image ? getImageUrl(shop.image) : ''}
              alt={shop.name}
              onError={handleImageError}
            />
            <div className="shop-image-overlay"></div>
            <div className="shop-overlay-content">
              {shop.category && (
                <span className="shop-category-tag">{shop.category.name?.toUpperCase() || 'SHOP'}</span>
              )}
              <h1 className="shop-title-overlay">{shop.name}</h1>
              <p className="shop-description-overlay">
                {t('shop.leadingProvider')} {shop.address || 'Egypt'}. {t('shop.specializingIn')} {shop.category?.name || 'Shopping'}.
              </p>
            </div>
            <div className="shop-overlay-buttons">
              <button className="overlay-btn share-btn" onClick={handleShare} aria-label="Share">
                <FiShare2 />
              </button>
              {shop.address && (
                <button className="overlay-btn location-btn" onClick={handleLocationClick} aria-label="Location">
                  <FiMapPin />
                </button>
              )}
              {shop.facebook && (
                <a
                  href={shop.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overlay-btn facebook-btn"
                  aria-label="Facebook"
                >
                  <FaFacebook />
                </a>
              )}
              {shop.instagram && (
                <a
                  href={shop.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overlay-btn instagram-btn"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
              )}
              {shop.website && (
                <a
                  href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overlay-btn website-btn"
                  aria-label="Website"
                >
                  <FaGlobe />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Product Type Filters */}
        {productTypes.length > 0 && (
          <div className="product-type-filters">
            <button
              className={`filter-btn ${selectedProductType === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedProductType('all')}
            >
              All
            </button>
            {productTypes.map((type, index) => (
              <button
                key={index}
                className={`filter-btn ${selectedProductType === type ? 'active' : ''}`}
                onClick={() => setSelectedProductType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Products Section - hot offers appear first in the grid */}
        <div className="shop-products">
          <h2>Products ({orderedProducts.length})</h2>
          <ProductGrid products={orderedProducts} loading={false} />
        </div>
      </div>
    </div>
  );
};

export default ShopPage;

