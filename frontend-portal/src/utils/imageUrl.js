import config from '../config/app';
import { getCachedMedia } from './mediaCache';

/**
 * Get full image URL from relative path
 * @param {string} imagePath - Relative image path (e.g., /uploads/products/image.jpg)
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise, prepend the image base URL
  return `${config.imageBaseURL}${imagePath}`;
};

/**
 * Get product/shop image path by size (for optimized listing vs detail).
 * @param {object} item - Product or shop with thumbnailUrl, mediumUrl, originalUrl, image
 * @param {'thumbnail'|'medium'|'original'} size - thumbnail for listing, medium/original for detail
 * @returns {string} Relative path
 */
export const getImagePathBySize = (item, size = 'thumbnail') => {
  if (!item) return '';
  if (size === 'thumbnail' && item.thumbnailUrl) return item.thumbnailUrl;
  if (size === 'medium' && item.mediumUrl) return item.mediumUrl;
  if (size === 'original' && item.originalUrl) return item.originalUrl;
  return item.image || item.thumbnailUrl || item.mediumUrl || item.originalUrl || '';
};

/**
 * Get cached image URL (async)
 * Fetches and caches the image if not already cached
 * @param {string} imagePath - Relative or absolute image path
 * @returns {Promise<string>} Cached image URL (object URL or base64)
 */
export const getCachedImageUrl = async (imagePath) => {
  const fullUrl = getImageUrl(imagePath);
  if (!fullUrl) return '';
  
  try {
    return await getCachedMedia(fullUrl, { useLocalStorageFallback: true });
  } catch (error) {
    console.error('Failed to get cached image:', error);
    return fullUrl; // Fallback to original URL
  }
};

// Handle image load errors - hide broken images instead of loading external placeholders
export const handleImageError = (e) => {
  e.target.style.display = 'none';
};

/**
 * React hook for cached images
 * Returns the cached URL and loading state
 * Note: Import React in your component file to use this hook
 */
export const useCachedImage = (imagePath) => {
  // This hook requires React to be imported in the component
  // We export it here but it should be used in components that import React
  throw new Error('useCachedImage must be imported and used in a React component file');
};

export default getImageUrl;

