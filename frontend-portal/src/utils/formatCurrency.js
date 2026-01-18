import i18n from '../i18n/config';

/**
 * Formats price with currency symbol based on current language
 * @param {number} price - The price value
 * @returns {string} Formatted price with currency (e.g., "EGP 100" or "100 جنيه")
 */
const formatCurrency = (price) => {
  const currentLanguage = i18n.language || 'en';
  
  // Default to Arabic if language is 'ar' or starts with 'ar-'
  const isArabic = currentLanguage === 'ar' || currentLanguage.startsWith('ar');
  
  if (isArabic) {
    return `${price} جنيه`;
  } else {
    return `EGP ${price}`;
  }
};

export default formatCurrency;