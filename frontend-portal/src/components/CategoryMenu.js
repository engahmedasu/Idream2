import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import './CategoryMenu.css';

const CategoryMenu = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    
    // Refresh categories every 2 minutes (reduced from 30 seconds) to get updates from admin portal
    const refreshInterval = setInterval(() => {
      fetchCategories();
    }, 120000); // 2 minutes

    // Refresh when window regains focus (with debounce to prevent multiple calls)
    let focusTimeout;
    const handleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        fetchCategories();
      }, 1000); // Wait 1 second after focus to avoid rapid calls
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?isActive=true');
      // Categories are already sorted by order on the backend
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon component from category icon name
  const getCategoryIcon = (iconName) => {
    if (!iconName) return FiIcons.FiShoppingBag;
    // Get the icon component from react-icons/fi
    const IconComponent = FiIcons[iconName] || FiIcons.FiShoppingBag;
    return IconComponent;
  };

  if (loading && categories.length === 0) {
    return <div className="category-menu loading">{t('common.loading')}</div>;
  }

  if (categories.length === 0) {
    return null; // Don't show category menu if no categories
  }

  return (
    <nav className="nav-tabs category-menu">
      <div className="nav-tabs-container category-menu-container">
        {categories.map(category => {
          const isActive = location.pathname === `/category/${category._id}`;
          const IconComponent = getCategoryIcon(category.icon);
          return (
            <Link
              key={category._id}
              to={`/category/${category._id}`}
              className={`nav-tab category-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent className="category-icon" />
              <span className="category-text">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default CategoryMenu;
