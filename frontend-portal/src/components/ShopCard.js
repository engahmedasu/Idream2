import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiShare2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import getImageUrl, { handleImageError } from '../utils/imageUrl';
import './ShopCard.css';

const ShopCard = ({ shop }) => {
  const { t } = useTranslation();

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <Link to={`/shop/${shop.shareLink}`} className="shop-card">
      <div className="shop-image">
        <img
          src={shop.image ? getImageUrl(shop.image) : ''}
          alt={shop.name}
          onError={handleImageError}
        />
      </div>
      <div className="shop-info">
        <h3 className="shop-name">{shop.name}</h3>
        <p className="shop-description">
          {t('shop.leadingProvider')} {shop.address || 'Egypt'}. {t('shop.specializingIn')} {shop.category?.name || 'Shopping'}.
        </p>
        <div className="shop-meta">
          <span className="shop-hours">{t('shop.operatingHours')}</span>
        </div>
        <div className="shop-footer">
          <span className="category-tag">{shop.category?.name || 'Shopping'}</span>
          <button
            className="share-button"
            onClick={handleShare}
            aria-label={t('shop.shareShop') || 'Share shop'}
          >
            <FiShare2 />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;
