import config from '../config/app';

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

// Handle image load errors - hide broken images instead of loading external placeholders
export const handleImageError = (e) => {
  e.target.style.display = 'none';
};

export default getImageUrl;

