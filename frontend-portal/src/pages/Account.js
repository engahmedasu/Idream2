import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLogOut } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import './Account.css';

const Account = () => {
  const { t } = useTranslation();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="account-page">
      <div className="account-card">
        <div className="account-header-row">
          <div className="account-avatar">
            <FiUser />
          </div>
          <div>
            <h1 className="account-title">{t('account.title') || 'My Account'}</h1>
            <p className="account-subtitle">
              {t('account.subtitle') || 'Manage your profile and sign out.'}
            </p>
          </div>
        </div>

        <div className="account-info">
          <div className="info-row">
            <FiMail />
            <div>
              <div className="info-label">{t('auth.email') || 'Email'}</div>
              <div className="info-value">{user?.email || '-'}</div>
            </div>
          </div>
          <div className="info-row">
            <FiPhone />
            <div>
              <div className="info-label">{t('auth.mobileNumber') || 'Phone'}</div>
              <div className="info-value">{user?.phone || '-'}</div>
            </div>
          </div>
          <div className="info-row">
            <FiUser />
            <div>
              <div className="info-label">Role</div>
              <div className="info-value">
                {user?.role?.name || user?.role || 'Guest'}
              </div>
            </div>
          </div>
        </div>

        <div className="account-actions">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            {t('header.logout') || 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
