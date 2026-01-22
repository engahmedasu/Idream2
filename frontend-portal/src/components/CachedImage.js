import React, { useState, useEffect } from 'react';
import { getCachedImageUrl, getImageUrl } from '../utils/imageUrl';

/**
 * CachedImage component - Drop-in replacement for <img> with automatic caching
 * 
 * @param {string} src - Image path (relative or absolute)
 * @param {string} alt - Alt text
 * @param {object} ...props - All other img props
 * 
 * @example
 * <CachedImage src="/uploads/products/image.jpg" alt="Product" className="product-img" />
 */
const CachedImage = ({ src, alt, ...props }) => {
  const [cachedSrc, setCachedSrc] = useState(src ? getImageUrl(src) : '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setCachedSrc('');
      setLoading(false);
      return;
    }

    const loadCached = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await getCachedImageUrl(src);
        setCachedSrc(url);
      } catch (err) {
        console.error('Failed to load cached image:', err);
        setCachedSrc(getImageUrl(src)); // Fallback to original URL
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCached();
  }, [src]);

  if (!src) return null;

  return (
    <img
      src={cachedSrc}
      alt={alt}
      {...props}
      style={{
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.3s',
        ...props.style
      }}
      onError={(e) => {
        // If cached version fails, try original URL
        if (cachedSrc !== getImageUrl(src)) {
          setCachedSrc(getImageUrl(src));
        } else {
          setError(true);
          if (props.onError) props.onError(e);
        }
      }}
    />
  );
};

export default CachedImage;
