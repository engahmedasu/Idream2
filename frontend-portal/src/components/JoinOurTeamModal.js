import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiUsers, FiSend, FiFile, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './RequestModal.css';

const JoinOurTeamModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    positionOfInterest: '',
    coverLetter: ''
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
      submitData.append('type', 'join-our-team');
      submitData.append('fullName', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('positionOfInterest', formData.positionOfInterest);
      submitData.append('coverLetter', formData.coverLetter);
      
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
          ? 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.'
          : 'Your application has been submitted successfully! We will contact you soon.'
      );
      setFormData({
        fullName: '',
        email: '',
        positionOfInterest: '',
        coverLetter: ''
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
        (isRTL ? 'حدث خطأ أثناء إرسال الطلب' : 'Failed to submit application')
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
          <FiUsers className="request-modal-icon" />
          <h2 className="request-modal-title">
            {isRTL ? 'انضم إلى فريقنا' : 'Join Our Team'}
          </h2>
          <p className="request-modal-subtitle">
            {isRTL 
              ? 'نحن دائماً نبحث عن أشخاص شغوفين وموهوبين للانضمام إلى iDream. إذا كنت تؤمن بالابتكار والعمل الجماعي، نحب أن نسمع منك.'
              : "We're always looking for passionate and talented people to join iDream. If you believe in innovation and teamwork, we'd love to hear from you."
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
            <label htmlFor="positionOfInterest">
              {isRTL ? 'المنصب المهتم به' : 'Position of Interest'} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="positionOfInterest"
              name="positionOfInterest"
              value={formData.positionOfInterest}
              onChange={handleChange}
              placeholder={isRTL ? 'مثال: مطور برمجيات، مصمم جرافيك...' : 'e.g., Software Developer, Graphic Designer...'}
              required
            />
          </div>

          <div className="request-form-group">
            <label htmlFor="coverLetter">
              {isRTL ? 'رسالة التقديم' : 'Cover Letter'} <span className="required">*</span>
            </label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleChange}
              placeholder={isRTL ? 'أخبرنا عن نفسك، خبراتك، وما الذي يجذبك للانضمام إلى فريقنا...' : 'Tell us about yourself, your experience, and what attracts you to join our team...'}
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
            <span>{isRTL ? 'إرسال الطلب' : 'SUBMIT APPLICATION'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinOurTeamModal;
