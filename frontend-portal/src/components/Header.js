import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiBell, FiMessageCircle, FiHome, FiLogOut } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import CategoryMenu from './CategoryMenu';
import './Header.css';

const Header = ({ onCartClick }) => {
  const { user, logout } = useAuth();
  const { getCartItemCount, clearCart } = useCart();
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  
  // Check if we're on the home screen
  const isHomeScreen = location.pathname === '/' || location.pathname === '';

  useEffect(() => {
    // Set initial direction based on language
    const lang = localStorage.getItem('i18nextLng') || 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  // Sync search input with URL query param
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // Clear search if input is empty
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear cart before logging out (while user still exists)
      await clearCart();
    } catch (error) {
      // Ignore errors during cart clear, still proceed with logout
      console.error('Error clearing cart during logout:', error);
    }
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src="/logo.svg" alt="iDREAM" className="logo-image" />
          </Link>

          <form className="search-bar" onSubmit={handleSearch}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="header-actions">
            <button 
              className="btn-partner"
              onClick={() => navigate('/subscription-plans')}
            >
              <span>🤝</span> {t('header.becomePartner')}
            </button>
            <LanguageSwitcher />
            <button 
              className="btn-enterprise"
              onClick={() => navigate('/enterprise-portal')}
            >
              <FiHome /> {t('header.enterprisePortal')}
            </button>
            {user ? (
              <>
                {!isHomeScreen && (
                  <>
                    <button className="icon-btn">
                      <FiBell />
                    </button>
                    <button className="icon-btn">
                      <FiMessageCircle />
                    </button>
                  </>
                )}
                <button 
                  className="icon-btn cart-link"
                  onClick={onCartClick}
                >
                  <FiShoppingCart />
                  {getCartItemCount() > 0 && (
                    <span className="cart-badge">{getCartItemCount()}</span>
                  )}
                </button>
                <div
                  className="user-profile"
                  onClick={() => setAccountOpen(!accountOpen)}
                >
                  <FiUser />
                  {accountOpen && (
                    <div
                      className="account-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="account-header">
                        <div className="account-name">
                          {user?.email || ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="account-item"
                        onClick={() => {
                          setAccountOpen(false);
                          navigate('/account');
                        }}
                      >
                        <FiUser />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        className="account-item logout"
                        onClick={handleLogout}
                      >
                        <FiLogOut />
                        <span>{t('header.logout') || 'Logout'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="icon-btn">
                  <FiUser />
                </Link>
                <button 
                  className="icon-btn cart-link"
                  onClick={onCartClick}
                >
                  <FiShoppingCart />
                  {getCartItemCount() > 0 && (
                    <span className="cart-badge">{getCartItemCount()}</span>
                  )}
                </button>
              </>
            )}
          </div>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>
      <CategoryMenu />
    </>
  );
};

export default Header;
