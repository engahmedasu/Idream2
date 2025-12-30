import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiMail, FiPhone, FiMapPin, FiSend, FiFacebook } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './ContactUsModal.css';

const ContactUsModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Marketing',
    message: ''
  });

  const services = [
    'Marketing',
    'AI Integration',
    'Custom Platform',
    'Consulting',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/contact', formData);
      toast.success(
        isRTL 
          ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.'
          : 'Your message has been sent successfully! We will contact you soon.'
      );
      setFormData({
        name: '',
        email: '',
        service: 'Marketing',
        message: ''
      });
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        (isRTL ? 'حدث خطأ أثناء إرسال الرسالة' : 'Failed to send message')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-us-modal-overlay" onClick={onClose}>
      <div 
        className={`contact-us-modal ${isRTL ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="contact-us-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="contact-us-container">
          {/* Left Column - Contact Info */}
          <div className="contact-us-info">
            <h2 className="contact-us-title">
              {isRTL ? 'دعنا نبني شيئاً استثنائياً' : "Let's Build Something"}
              <span className="contact-us-title-highlight">
                {isRTL ? ' استثنائياً' : ' Extraordinary'}
              </span>
            </h2>
            
            <p className="contact-us-description">
              {isRTL 
                ? 'سواء كنت تحتاج إلى تكامل الذكاء الاصطناعي، أو استراتيجية تسويق جديدة، أو منصة مخصصة، iDream Egypt جاهز للشراكة معك.'
                : 'Whether you need AI integration, a new marketing strategy, or a custom platform, iDream Egypt is ready to partner with you.'
              }
            </p>

            <div className="contact-us-details">
              <div className="contact-us-detail-item">
                <div className="contact-us-icon email">
                  <FiMail />
                </div>
                <div className="contact-us-detail-content">
                  <span className="contact-us-detail-label">
                    {isRTL ? 'راسلنا' : 'Email Us'}
                  </span>
                  <a href="mailto:contact@idreamegypt.com" className="contact-us-detail-value">
                    contact@idreamegypt.com
                  </a>
                </div>
              </div>

              <div className="contact-us-detail-item">
                <div className="contact-us-icon phone">
                  <FiPhone />
                </div>
                <div className="contact-us-detail-content">
                  <span className="contact-us-detail-label">
                    {isRTL ? 'اتصل بنا' : 'Call Us'}
                  </span>
                  <a href="tel:01555557337" className="contact-us-detail-value">
                    01555557337
                  </a>
                </div>
              </div>

              <div className="contact-us-detail-item">
                <div className="contact-us-icon location">
                  <FiMapPin />
                </div>
                <div className="contact-us-detail-content">
                  <span className="contact-us-detail-label">
                    {isRTL ? 'زرنا' : 'Visit Us'}
                  </span>
                  <span className="contact-us-detail-value">
                    {isRTL ? 'القاهرة، مصر' : 'Cairo, Egypt'}
                  </span>
                </div>
              </div>
            </div>

            <a 
              href="https://facebook.com/idreamegypt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-us-facebook-btn"
            >
              <FiFacebook />
              <span>
                {isRTL ? 'تابعنا على فيسبوك' : 'Follow us on Facebook'}
              </span>
              <span className="contact-us-facebook-handle">@idreamegypt</span>
            </a>

            <div className="contact-us-security">
              <div className="contact-us-shield-icon">🛡️</div>
              <span className="contact-us-security-text">
                {isRTL 
                  ? 'معالجة آمنة ومشفرة للبيانات بواسطة FIREBASE'
                  : 'ENCRYPTED & SECURE LEAD PROCESSING BY FIREBASE'
                }
              </span>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="contact-us-form-container">
            <form className="contact-us-form" onSubmit={handleSubmit}>
              <div className="contact-us-form-group">
                <label htmlFor="name">
                  {isRTL ? 'الاسم' : 'Name'}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={isRTL ? 'اسمك' : 'Your Name'}
                  required
                />
              </div>

              <div className="contact-us-form-group">
                <label htmlFor="email">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="contact-us-form-group">
                <label htmlFor="service">
                  {isRTL ? 'الخدمة المهتم بها' : 'Interested Service'}
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  {services.map(service => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="contact-us-form-group">
                <label htmlFor="message">
                  {isRTL ? 'الرسالة' : 'Message'}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={isRTL ? 'أخبرنا عن مشروعك...' : 'Tell us about your project...'}
                  rows="5"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="contact-us-submit-btn"
                disabled={loading}
              >
                <FiSend />
                <span>{isRTL ? 'إرسال الرسالة' : 'SEND MESSAGE'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsModal;

