import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('admin_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for token in URL hash (from Enterprise Portal redirect)
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
      const token = hash.split('token=')[1].split('&')[0];
      if (token) {
        localStorage.setItem('admin_token', token);
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        fetchUser();
        return;
      }
    }

    // Check for existing token in localStorage
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, phone, password) => {
    const loginData = email
      ? { email, password }
      : { phone, password };
    
    const response = await api.post('/auth/login', loginData);
    localStorage.setItem('admin_token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

