import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiPhone, FiMail, FiKey } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loginType, setLoginType] = useState('phone'); // 'phone' or 'email'
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
      
      toast.success(t('common.success'));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-back-link">
        <Link to="/">
          <FiArrowLeft /> {t('auth.backToMall')}
        </Link>
      </div>
      <div className="auth-container">
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab active">
            {t('auth.signIn')}
          </Link>
          <Link to="/register" className="auth-tab">
            {t('auth.createAccount')}
          </Link>
        </div>

        <div className="auth-icon">
          <div className="icon-circle">
            <FiLock />
          </div>
        </div>

        <h1 className="auth-title">{t('auth.welcomeBack')}</h1>
        <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

        {/* Login Type Toggle */}
        <div className="login-type-toggle">
          <button
            type="button"
            className={`toggle-btn ${loginType === 'phone' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('phone')}
          >
            <FiPhone /> {t('auth.mobileNumber')}
          </button>
          <button
            type="button"
            className={`toggle-btn ${loginType === 'email' ? 'active' : ''}`}
            onClick={() => handleLoginTypeChange('email')}
          >
            <FiMail /> {t('auth.email')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              {loginType === 'phone' ? t('auth.mobileNumber') : t('auth.email')}
            </label>
            <div className="input-with-icon">
              {loginType === 'phone' ? (
                <FiPhone className="input-icon" />
              ) : (
                <FiMail className="input-icon" />
              )}
              <input
                type={loginType === 'phone' ? 'tel' : 'email'}
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder={
                  loginType === 'phone'
                    ? t('auth.phonePlaceholder')
                    : 'example@email.com'
                }
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t('auth.password')}</label>
            <div className="input-with-icon">
              <FiKey className="input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            <span>{t('auth.login')}</span>
            <FiArrowLeft className="arrow-icon" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
