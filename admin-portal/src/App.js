import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Shops from './pages/Shops';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Videos from './pages/Videos';
import Advertisements from './pages/Advertisements';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import Reports from './pages/Reports';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Pages from './pages/Pages';
import ContactRequests from './pages/ContactRequests';
import JoinOurTeam from './pages/JoinOurTeam';
import NewIdeas from './pages/NewIdeas';
import HireExpert from './pages/HireExpert';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const userRole = user.role?.name || user.role;
  
  if (!allowedRoles.includes(userRole)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route 
          path="users" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <Users />
            </RoleProtectedRoute>
          } 
        />
        <Route path="shops" element={<Shops />} />
        <Route path="products" element={<Products />} />
        <Route 
          path="categories" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin', 'mallAdmin']}>
              <Categories />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="videos" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <Videos />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="advertisements" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <Advertisements />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="roles" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <Roles />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="permissions" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <Permissions />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="subscription-plans" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin', 'mallAdmin']}>
              <SubscriptionPlans />
            </RoleProtectedRoute>
          } 
        />
        <Route path="reports/products" element={<Reports reportType="products" />} />
        <Route path="reports/shares" element={<Reports reportType="shares" />} />
        <Route path="reports/orders" element={<Reports reportType="orders" />} />
        <Route 
          path="reports/subscription-logs" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin', 'Finance']}>
              <Reports reportType="subscription-logs" />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="pages" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <Pages />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="contact-requests" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <ContactRequests />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="requests/join-our-team" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <JoinOurTeam />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="requests/new-ideas" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <NewIdeas />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="requests/hire-expert" 
          element={
            <RoleProtectedRoute allowedRoles={['superAdmin']}>
              <HireExpert />
            </RoleProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

