import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './Auth.css';

const VerifyOTP = () => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else {
      navigate('/register');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await verifyOTP(email, otp);
      toast.success(t('common.success'));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
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
        <div className="auth-icon">
          <div className="icon-circle">
            <FiMail />
          </div>
        </div>

        <h1 className="auth-title">{t('auth.verifyEmail')}</h1>
        <p className="auth-subtitle">
          {t('auth.otpSent')} <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.enterOTP')}</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('auth.otpPlaceholder')}
              maxLength={6}
              required
              className="otp-input"
            />
          </div>
          <button type="submit" disabled={loading || otp.length !== 6} className="auth-button">
            <span>{loading ? t('auth.verifying') : t('auth.verify')}</span>
            <FiArrowLeft className="arrow-icon" style={{ transform: 'rotate(180deg)' }} />
          </button>
        </form>
        <p className="auth-link">
          {t('auth.didntReceive')}{' '}
          <button onClick={handleResendOTP} className="link-button">
            {t('auth.resendOTP')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
