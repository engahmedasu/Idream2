import { useState, useEffect } from 'react';
import { getCachedImageUrl, getImageUrl } from '../utils/imageUrl';

/**
 * React hook for cached images
 * Returns the cached URL and loading state
 * @param {string} imagePath - Relative or absolute image path
 * @returns {{ cachedUrl: string, loading: boolean }}
 */
export const useCachedImage = (imagePath) => {
  const [cachedUrl, setCachedUrl] = useState(imagePath ? getImageUrl(imagePath) : '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imagePath) {
      setCachedUrl('');
      setLoading(false);
      return;
    }

    const loadCached = async () => {
      try {
        setLoading(true);
        const url = await getCachedImageUrl(imagePath);
        setCachedUrl(url);
      } catch (error) {
        console.error('Failed to load cached image:', error);
        setCachedUrl(getImageUrl(imagePath));
      } finally {
        setLoading(false);
      }
    };

    loadCached();
  }, [imagePath]);

  return { cachedUrl, loading };
};

export default useCachedImage;
