import React, { useState } from 'react';
import getImageUrl, { getImagePathBySize, handleImageError } from '../utils/imageUrl';
import './OptimizedImage.css';

/**
 * Optimized image: lazy loading, skeleton, size-aware (thumbnail / medium / original).
 * Use thumbnail in listings, medium/original in detail.
 */
const OptimizedImage = ({
  item,
  size = 'thumbnail',
  alt = '',
  className = '',
  ...props
}) => {
  const path = getImagePathBySize(item, size);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!path) return <div className={`optimized-image-placeholder ${className}`} aria-hidden />;

  const src = getImageUrl(path);

  return (
    <span className={`optimized-image-wrap ${className}`}>
      {!loaded && !error && <span className="optimized-image-skeleton" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`optimized-image ${loaded ? 'loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setError(true);
          handleImageError(e);
        }}
        {...props}
      />
    </span>
  );
};

export default OptimizedImage;
