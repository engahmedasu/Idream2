import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import AIAgent from './components/AIAgent';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import ShopPage from './pages/ShopPage';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Account from './pages/Account';
import EnterprisePortal from './pages/EnterprisePortal';
import SubscriptionPlans from './pages/SubscriptionPlans';
import PageDetail from './pages/PageDetail';
// eslint-disable-next-line no-unused-vars
import OrderSummary from './pages/OrderSummary';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdvertisementProvider } from './context/AdvertisementContext';

function AppContent() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const isEnterprisePortal = location.pathname === '/enterprise-portal';

  return (
    <div className="App">
      {!isEnterprisePortal && <Header onCartClick={() => setCartOpen(true)} />}
      <main style={{ minHeight: isEnterprisePortal ? '100vh' : 'calc(100vh - 200px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/shop/:shareLink" element={<ShopPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/enterprise-portal" element={<EnterprisePortal />} />
          <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          <Route path="/page/:slug" element={<PageDetail />} />
          <Route path="/order/:orderNumber" element={<OrderSummary />} />
        </Routes>
      </main>
      {!isEnterprisePortal && <Footer />}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      {!isEnterprisePortal && <AIAgent />}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AdvertisementProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </AdvertisementProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
