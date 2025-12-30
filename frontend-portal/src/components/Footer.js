import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUsers, FiZap, FiBriefcase } from 'react-icons/fi';
import api from '../utils/api';
import PageModal from './PageModal';
import ContactUsModal from './ContactUsModal';
import './Footer.css';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPageSlug, setSelectedPageSlug] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactUsOpen, setIsContactUsOpen] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await api.get('/pages', { params: { isActive: true } });
        setPages(response.data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } catch (error) {
        console.error('Failed to fetch pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const getPageTitle = (page) => {
    const currentLang = i18n.language || 'en';
    return page.title?.[currentLang] || page.title?.en || page.title?.ar || '';
  };

  const handlePageClick = (e, slug) => {
    e.preventDefault();
    // Check if it's "Contact Us" page
    if (slug === 'contact-us') {
      setIsContactUsOpen(true);
    } else {
      setSelectedPageSlug(slug);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPageSlug(null);
  };

  return (
    <>
      <section className="grow-section">
        <div className="grow-container">
          <h2>{t('footer.growWithIdream')}</h2>
          <div className="grow-buttons">
            <button className="grow-btn primary">
              <FiUsers />
              {t('footer.joinTeam')}
            </button>
            <button className="grow-btn">
              <FiZap />
              {t('footer.haveIdea')}
            </button>
            <button className="grow-btn">
              <FiBriefcase />
              {t('footer.hireExpert')}
            </button>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} {t('footer.rightsReserved')}</p>
          <div className="footer-links">
            {loading ? (
              <span>Loading...</span>
            ) : pages.length > 0 ? (
              pages.map((page) => (
                <a
                  key={page._id}
                  href="#"
                  onClick={(e) => handlePageClick(e, page.slug)}
                  className="footer-link"
                >
                  {getPageTitle(page)}
                </a>
              ))
            ) : (
              <>
                <a href="#" onClick={(e) => { e.preventDefault(); }}>{t('footer.privacyPolicy')}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); }}>{t('footer.termsOfService')}</a>
                <a href="#" onClick={(e) => { e.preventDefault(); }}>{t('footer.contactSupport')}</a>
              </>
            )}
          </div>
        </div>
      </footer>
      
      <PageModal
        slug={selectedPageSlug}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      
      <ContactUsModal
        isOpen={isContactUsOpen}
        onClose={() => setIsContactUsOpen(false)}
      />
    </>
  );
};

export default Footer;
