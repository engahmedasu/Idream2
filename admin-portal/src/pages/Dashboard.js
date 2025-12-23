import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    shops: 0,
    products: 0,
    pendingApprovals: 0,
  });

  const isShopAdmin = user?.role?.name === 'shopAdmin' || user?.role === 'shopAdmin';
  const isSuperAdmin = user?.role?.name === 'superAdmin' || user?.role === 'superAdmin';
  const isMallAdmin = user?.role?.name === 'mallAdmin' || user?.role === 'mallAdmin';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        if (isShopAdmin) {
          // For shopAdmin, only fetch their shop's products
          const productsRes = await api.get('/products').catch(() => ({ data: [] }));
          const products = productsRes.data || [];
          
          // Filter pending products (not approved or not active)
          const pendingProducts = products.filter(prod => !prod.isApproved || !prod.isActive).length;

          setStats({
            users: 0, // shopAdmin doesn't see users
            shops: 0, // shopAdmin doesn't see shops
            products: products.length,
            pendingApprovals: pendingProducts,
          });
        } else if (isMallAdmin) {
          // For mallAdmin, only fetch their shops and products from those shops
          const [shopsRes, productsRes] = await Promise.all([
            api.get('/shops').catch(() => ({ data: [] })),
            api.get('/products').catch(() => ({ data: [] })),
          ]);

          const shops = shopsRes.data || [];
          const products = productsRes.data || [];

          const pendingShops = shops.filter(shop => !shop.isApproved || !shop.isActive).length;
          const pendingProducts = products.filter(prod => !prod.isApproved || !prod.isActive).length;

          setStats({
            users: 0, // mallAdmin doesn't see users
            shops: shops.length,
            products: products.length,
            pendingApprovals: pendingShops + pendingProducts,
          });
        } else {
          // For superAdmin, fetch all data
          const [usersRes, shopsRes, productsRes] = await Promise.all([
            api.get('/users').catch(() => ({ data: [] })),
            api.get('/shops').catch(() => ({ data: [] })),
            api.get('/products').catch(() => ({ data: [] })),
          ]);

          const users = usersRes.data || [];
          const shops = shopsRes.data || [];
          const products = productsRes.data || [];

          const pendingShops = shops.filter(shop => !shop.isApproved || !shop.isActive).length;
          const pendingProducts = products.filter(prod => !prod.isApproved || !prod.isActive).length;

          setStats({
            users: users.length,
            shops: shops.length,
            products: products.length,
            pendingApprovals: pendingShops + pendingProducts,
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isShopAdmin, isMallAdmin]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        {isSuperAdmin && (
          <button
            type="button"
            className="stat-card clickable"
            onClick={() => handleNavigate('/users')}
          >
            <div className="stat-icon users">
              <FiUsers />
            </div>
            <div className="stat-text">
              <h3>Total Users</h3>
              <p className="stat-value">{loading ? '...' : stats.users}</p>
            </div>
          </button>
        )}

        {(isSuperAdmin || isMallAdmin) && (
          <button
            type="button"
            className="stat-card clickable"
            onClick={() => handleNavigate('/shops')}
          >
            <div className="stat-icon shops">
              <FiShoppingBag />
            </div>
            <div className="stat-text">
              <h3>{isMallAdmin ? 'My Shops' : 'Total Shops'}</h3>
              <p className="stat-value">{loading ? '...' : stats.shops}</p>
            </div>
          </button>
        )}

        <button
          type="button"
          className="stat-card clickable"
          onClick={() => handleNavigate('/products')}
        >
          <div className="stat-icon products">
            <FiPackage />
          </div>
          <div className="stat-text">
            <h3>{isShopAdmin ? 'My Products' : isMallAdmin ? 'My Products' : 'Total Products'}</h3>
            <p className="stat-value">{loading ? '...' : stats.products}</p>
          </div>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            className="stat-card clickable"
            onClick={() => handleNavigate('/products')}
          >
            <div className="stat-icon pending">
              <FiAlertCircle />
            </div>
            <div className="stat-text">
              <h3>Pending Approvals</h3>
              <p className="stat-value">{loading ? '...' : stats.pendingApprovals}</p>
            </div>
          </button>
        )}

        {(isMallAdmin || isShopAdmin) && (
          <button
            type="button"
            className="stat-card clickable"
            onClick={() => handleNavigate('/products')}
          >
            <div className="stat-icon pending">
              <FiAlertCircle />
            </div>
            <div className="stat-text">
              <h3>Pending Products</h3>
              <p className="stat-value">{loading ? '...' : stats.pendingApprovals}</p>
            </div>
          </button>
        )}
      </div>

      <div className="dashboard-content">
        <p>Welcome to iDream Admin Portal</p>
      </div>
    </div>
  );
};

export default Dashboard;

