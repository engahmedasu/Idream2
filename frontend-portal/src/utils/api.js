import axios from 'axios';
import config from '../config/app';

const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect to login if we're not on a public route
      const publicRoutes = ['/', '/category/', '/product/', '/shop/', '/register', '/verify-otp', '/enterprise-portal'];
      const currentPath = window.location.pathname;
      const isPublicRoute = publicRoutes.some(route => currentPath === route || currentPath.startsWith(route));
      
      // Only redirect if we're on a protected route (like /account, /cart)
      if (!isPublicRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

