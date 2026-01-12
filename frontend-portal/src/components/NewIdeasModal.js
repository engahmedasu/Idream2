import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiZap, FiSend, FiFile, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './RequestModal.css';

const NewIdeasModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    ideaTitle: '',
    briefIdeaDescription: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
      const allowedExtensions = ['.doc', '.docx', '.pdf'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast.error(
          isRTL 
            ? 'يرجى اختيار ملف بصيغة .doc أو .docx أو .pdf'
            : 'Please select a file in .doc, .docx, or .pdf format'
        );
        e.target.value = '';
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          isRTL 
            ? 'حجم الملف يجب أن يكون أقل من 10 ميجابايت'
            : 'File size must be less than 10MB'
        );
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('document');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('type', 'new-ideas');
      submitData.append('fullName', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('ideaTitle', formData.ideaTitle);
      submitData.append('briefIdeaDescription', formData.briefIdeaDescription);
      
      if (selectedFile) {
        submitData.append('document', selectedFile);
      }

      await api.post('/requests', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(
        isRTL 
          ? 'تم إرسال فكرتك بنجاح! سنتواصل معك قريباً.'
          : 'Your idea has been submitted successfully! We will contact you soon.'
      );
      setFormData({
        fullName: '',
        email: '',
        ideaTitle: '',
        briefIdeaDescription: ''
      });
      setSelectedFile(null);
      const fileInput = document.getElementById('document');
      if (fileInput) {
        fileInput.value = '';
      }
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        (isRTL ? 'حدث خطأ أثناء إرسال الفكرة' : 'Failed to submit idea')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="request-modal-overlay" onClick={onClose}>
      <div 
        className={`request-modal ${isRTL ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="request-modal-close" onClick={onClose}>
          <FiX />
        </button>

        <div className="request-modal-header">
          <FiZap className="request-modal-icon" />
          <h2 className="request-modal-title">
            {isRTL ? 'لدي فكرة جديدة' : 'I Have a New Idea'}
          </h2>
          <p className="request-modal-subtitle">
            {isRTL 
              ? 'هل لديك فكرة شركة ناشئة أو منتج رقمي في ذهنك؟ شارك فكرتك معنا ودعنا نحولها إلى قصة نجاح حقيقية.'
              : 'Have a startup idea or a digital product in mind? Share your idea with us and let\'s turn it into a real success story.'
            }
          </p>
        </div>

        <form className="request-modal-form" onSubmit={handleSubmit}>
          <div className="request-form-group">
            <label htmlFor="fullName">
              {isRTL ? 'الاسم الكامل' : 'Full Name'} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder={isRTL ? 'اسمك الكامل' : 'Your Full Name'}
              required
            />
          </div>

          <div className="request-form-group">
            <label htmlFor="email">
              {isRTL ? 'البريد الإلكتروني' : 'Email Address'} <span className="required">*</span>
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

          <div className="request-form-group">
            <label htmlFor="ideaTitle">
              {isRTL ? 'عنوان الفكرة' : 'Idea Title'} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="ideaTitle"
              name="ideaTitle"
              value={formData.ideaTitle}
              onChange={handleChange}
              placeholder={isRTL ? 'عنوان مختصر لفكرتك' : 'Brief title for your idea'}
              required
            />
          </div>

          <div className="request-form-group">
            <label htmlFor="briefIdeaDescription">
              {isRTL ? 'وصف مختصر للفكرة' : 'Brief Idea Description'} <span className="required">*</span>
            </label>
            <textarea
              id="briefIdeaDescription"
              name="briefIdeaDescription"
              value={formData.briefIdeaDescription}
              onChange={handleChange}
              placeholder={isRTL ? 'أخبرنا عن فكرتك بالتفصيل...' : 'Tell us about your idea in detail...'}
              rows="6"
              required
            />
          </div>

          <div className="request-form-group">
            <label htmlFor="document">
              {isRTL ? 'مرفق (اختياري)' : 'Attachment (Optional)'}
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                id="document"
                name="document"
                accept=".doc,.docx,.pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="document" className="file-upload-label">
                <FiFile />
                <span>{isRTL ? 'اختر ملف' : 'Choose File'}</span>
              </label>
              {selectedFile && (
                <div className="selected-file">
                  <FiFile />
                  <span className="file-name">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="remove-file-btn"
                    title={isRTL ? 'إزالة الملف' : 'Remove file'}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              )}
            </div>
            <p className="file-hint">
              {isRTL 
                ? 'الصيغ المدعومة: .doc, .docx, .pdf (حد أقصى 10 ميجابايت)'
                : 'Supported formats: .doc, .docx, .pdf (max 10MB)'
              }
            </p>
          </div>

          <button 
            type="submit" 
            className="request-submit-btn"
            disabled={loading}
          >
            <FiSend />
            <span>{isRTL ? 'إرسال الفكرة' : 'SUBMIT IDEA'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewIdeasModal;
