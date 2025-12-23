import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiUsers, FiZap, FiBriefcase } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

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
            <a href="/privacy">{t('footer.privacyPolicy')}</a>
            <a href="/terms">{t('footer.termsOfService')}</a>
            <a href="/contact">{t('footer.contactSupport')}</a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
