import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../utils/api';
import './PageDetail.css';

const PageDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/pages/slug/${slug}`);
        setPage(response.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Page not found');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

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

  if (loading) {
    return (
      <div className="page-detail-container">
        <div className="page-detail-loading">Loading...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="page-detail-container">
        <div className="page-detail-error">
          <h2>Page Not Found</h2>
          <p>{error || 'The page you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/')} className="btn-back">
            <FiArrowLeft /> Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-detail-container">
      <div className="page-detail-content">
        <button onClick={() => navigate(-1)} className="btn-back">
          <FiArrowLeft /> Back
        </button>
        <h1 className="page-title">{getPageTitle()}</h1>
        <div 
          className="page-content"
          dangerouslySetInnerHTML={{ __html: getPageContent() }}
        />
      </div>
    </div>
  );
};

export default PageDetail;

