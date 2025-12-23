import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiMail, FiPhone, FiKey } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('common.error'));
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.phone, formData.password);
      toast.success(t('common.success'));
      navigate('/verify-otp', { state: { email: formData.email } });
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
          <Link to="/login" className="auth-tab">
            {t('auth.signIn')}
          </Link>
          <Link to="/register" className="auth-tab active">
            {t('auth.createAccount')}
          </Link>
        </div>

        <div className="auth-icon">
          <div className="icon-circle">
            <FiLock />
          </div>
        </div>

        <h1 className="auth-title">{t('auth.createAccount')}</h1>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.email')}</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder=""
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t('auth.mobileNumber')}</label>
            <div className="input-with-icon">
              <FiPhone className="input-icon" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('auth.phonePlaceholder')}
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
                placeholder=""
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="form-group">
            <label>{t('auth.confirmPassword')}</label>
            <div className="input-with-icon">
              <FiKey className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder=""
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            <span>{loading ? t('auth.registering') : t('auth.register')}</span>
            <FiArrowLeft className="arrow-icon" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
