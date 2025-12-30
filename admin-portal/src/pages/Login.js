import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiPhone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setFormData({ ...formData, identifier: '' }); // Clear input when switching
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate identifier based on login type
      if (loginType === 'email' && !validateEmail(formData.identifier)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (loginType === 'phone' && formData.identifier.length < 10) {
        toast.error('Please enter a valid phone number');
        setLoading(false);
        return;
      }

      // Call login with appropriate identifier
      if (loginType === 'email') {
        await login(formData.identifier, null, formData.password);
      } else {
        await login(null, formData.identifier, formData.password);
      }
      
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <h1>iDream Admin Portal</h1>
        
        {/* Login Type Toggle */}
        <div className="login-type-toggle">
          <button
            type="button"
            className={`toggle-btn ${loginType === 'email' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('email')}
          >
            <FiMail /> Email
          </button>
          <button
            type="button"
            className={`toggle-btn ${loginType === 'phone' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('phone')}
          >
            <FiPhone /> Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          <div className="form-group">
            <label>{loginType === 'email' ? 'Email' : 'Phone Number'}</label>
            <input
              type={loginType === 'email' ? 'email' : 'tel'}
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder={loginType === 'email' ? 'your-email@example.com' : '01xxxxxxxxx'}
              autoComplete="off"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

