import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX } from 'react-icons/fi';
import api from '../utils/api';
import './PageModal.css';

const PageModal = ({ slug, isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && slug) {
      fetchPage();
    } else {
      // Reset state when modal closes
      setPage(null);
      setError(null);
    }
  }, [isOpen, slug, i18n.language]); // Refetch when language changes

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/pages/slug/${slug}`);
      setPage(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Page not found');
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPageContent = () => {
    if (!page) return '';
    const currentLang = i18n.language || 'en';
    return page.content?.[currentLang] || page.content?.en || page.content?.ar || '';
  };

  const getPageTitle = () => {
    if (!page) return '';
    const currentLang = i18n.language || 'en';
    return page.title?.[currentLang] || page.title?.en || page.title?.ar || '';
  };

  const isRTL = i18n.language === 'ar';

  if (!isOpen) return null;

  return (
    <div className="page-modal-overlay" onClick={onClose}>
      <div 
        className={`page-modal-content ${isRTL ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="page-modal-header">
          <h2 className="page-modal-title">
            {loading ? 'Loading...' : error ? 'Error' : getPageTitle()}
          </h2>
          <button className="page-modal-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        
        <div className="page-modal-body">
          {loading ? (
            <div className="page-modal-loading">
              <div className="spinner"></div>
              <p>Loading content...</p>
            </div>
          ) : error ? (
            <div className="page-modal-error">
              <p>{error}</p>
              <p className="error-subtitle">The page you are looking for does not exist.</p>
            </div>
          ) : page ? (
            <div 
              className="page-modal-content-text"
              dangerouslySetInnerHTML={{ __html: getPageContent() }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PageModal;

