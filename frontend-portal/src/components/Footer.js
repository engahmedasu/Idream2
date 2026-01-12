import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUsers, FiZap, FiBriefcase } from 'react-icons/fi';
import api from '../utils/api';
import PageModal from './PageModal';
import ContactUsModal from './ContactUsModal';
import JoinOurTeamModal from './JoinOurTeamModal';
import NewIdeasModal from './NewIdeasModal';
import HireExpertModal from './HireExpertModal';
import './Footer.css';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPageSlug, setSelectedPageSlug] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactUsOpen, setIsContactUsOpen] = useState(false);
  const [isJoinOurTeamOpen, setIsJoinOurTeamOpen] = useState(false);
  const [isNewIdeasOpen, setIsNewIdeasOpen] = useState(false);
  const [isHireExpertOpen, setIsHireExpertOpen] = useState(false);

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
            <button 
              className="grow-btn primary"
              onClick={() => setIsJoinOurTeamOpen(true)}
            >
              <FiUsers />
              {t('footer.joinTeam')}
            </button>
            <button 
              className="grow-btn"
              onClick={() => setIsNewIdeasOpen(true)}
            >
              <FiZap />
              {t('footer.haveIdea')}
            </button>
            <button 
              className="grow-btn"
              onClick={() => setIsHireExpertOpen(true)}
            >
              <FiBriefcase />
              {t('footer.hireExpert')}
            </button>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="footer-container">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            {(() => {
              const rightsText = t('footer.rightsReserved');
              const currentLang = i18n.language || 'en';
              const companyName = currentLang === 'ar' ? 'iDream مصر' : 'iDream Egypt';
              const parts = rightsText.split(companyName);
              
              return (
                <>
                  {parts[0]}
                  <a 
                    href="https://www.idreamegypt.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="footer-company-link"
                  >
                    {companyName}
                  </a>
                  {parts[1]}
                </>
              );
            })()}
          </p>
          <div className="footer-links">
            {loading ? (
              <span>Loading...</span>
            ) : pages.length > 0 ? (
              pages.map((page) => (
                <button
                  key={page._id}
                  type="button"
                  onClick={(e) => handlePageClick(e, page.slug)}
                  className="footer-link"
                >
                  {getPageTitle(page)}
                </button>
              ))
            ) : (
              <>
                <button type="button" className="footer-link" onClick={(e) => { e.preventDefault(); }}>{t('footer.privacyPolicy')}</button>
                <button type="button" className="footer-link" onClick={(e) => { e.preventDefault(); }}>{t('footer.termsOfService')}</button>
                <button type="button" className="footer-link" onClick={(e) => { e.preventDefault(); }}>{t('footer.contactSupport')}</button>
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
      
      <JoinOurTeamModal
        isOpen={isJoinOurTeamOpen}
        onClose={() => setIsJoinOurTeamOpen(false)}
      />
      
      <NewIdeasModal
        isOpen={isNewIdeasOpen}
        onClose={() => setIsNewIdeasOpen(false)}
      />
      
      <HireExpertModal
        isOpen={isHireExpertOpen}
        onClose={() => setIsHireExpertOpen(false)}
      />
    </>
  );
};

export default Footer;
