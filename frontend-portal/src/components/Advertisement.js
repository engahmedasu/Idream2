import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import getImageUrl from '../utils/imageUrl';
import './Advertisement.css';

const Advertisement = ({ categoryId, side }) => {
  const [advertisement, setAdvertisement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      try {
        setLoading(true);
        const params = {
          category: categoryId,
          side: side
        };
        const response = await api.get('/advertisements/active', { params });
        
        // Get the first advertisement (highest priority)
        if (response.data && response.data.length > 0) {
          setAdvertisement(response.data[0]);
        } else {
          setAdvertisement(null);
        }
      } catch (error) {
        console.error('Error fetching advertisement:', error);
        setAdvertisement(null);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchAdvertisement();
    } else {
      setAdvertisement(null);
      setLoading(false);
    }
  }, [categoryId, side]);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!advertisement) {
    return null; // Don't render if no advertisement
  }

  const handleClick = () => {
    if (advertisement.redirectUrl) {
      window.open(advertisement.redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`advertisement-container advertisement-${side}`}>
      <div 
        className={`advertisement ${advertisement.redirectUrl ? 'clickable' : ''}`}
        onClick={handleClick}
      >
        <img 
          src={getImageUrl(advertisement.image)} 
          alt="Advertisement" 
          className="advertisement-image"
        />
      </div>
    </div>
  );
};

export default Advertisement;
