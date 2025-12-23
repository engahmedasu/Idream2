import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiZap } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import ShopCard from '../components/ShopCard';
import ProductGrid from '../components/ProductGrid';
import api from '../utils/api';
import './CategoryPage.css';

const CategoryPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCategoryData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoryRes, productsRes] = await Promise.all([
        api.get(`/categories/${id}`),
        api.get('/products', { params: { category: id, isActive: true } })
      ]);
      setCategoryData({
        ...categoryRes.data,
        products: productsRes.data
      });
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData]);

  if (loading) {
    return <div className="category-page loading">{t('common.loading')}</div>;
  }

  if (!categoryData) {
    return <div className="category-page">{t('common.error')}</div>;
  }

  const { category, hotOffers, shops } = categoryData;

  return (
    <div className="category-page">
      <div className="category-page-container">
        <h1 className="category-title">{category.name}</h1>
        {category.description && (
          <p className="category-description">{category.description}</p>
        )}

        {hotOffers && hotOffers.length > 0 && (
          <section className="hot-offers-section">
            <div className="section-header">
              <FiZap className="flame-icon" />
              <h2>{t('home.hotOffers')}</h2>
            </div>
            <ProductGrid products={hotOffers} loading={false} />
          </section>
        )}

        {shops && shops.length > 0 && (
          <section className="shops-section">
            <div className="section-header">
              <h2>{t('home.featuredShops')}</h2>
            </div>
            <div className="shops-grid">
              {shops.map(shop => (
                <ShopCard key={shop._id} shop={shop} />
              ))}
            </div>
          </section>
        )}

        {categoryData.products && categoryData.products.length > 0 && (
          <section className="products-section">
            <div className="section-header">
              <h2>{t('home.featuredShops')}</h2>
            </div>
            <ProductGrid
              products={categoryData.products || []}
              loading={false}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
