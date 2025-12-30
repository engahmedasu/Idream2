import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiArrowUp, FiArrowDown, FiX,
  FiGlobe
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import './Pages.css';

const Pages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    slug: '',
    title: { en: '', ar: '' },
    content: { en: '', ar: '' },
    order: 0,
    isActive: true
  });
  const [activeLanguageTab, setActiveLanguageTab] = useState('en'); // 'en' or 'ar'

  // Check if user has superAdmin role
  useEffect(() => {
    if (user) {
      const userRole = user.role?.name || user.role;
      if (userRole !== 'superAdmin') {
        toast.error('Access denied. Only super admin can access this page.');
        navigate('/');
      }
    }
  }, [user, navigate]);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== '') params.isActive = filterStatus === 'active';

      const response = await api.get('/pages', { params });
      setPages(response.data);
    } catch (error) {
      toast.error('Failed to fetch pages');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingPage) {
      setFormData({
        slug: '',
        title: { en: '', ar: '' },
        content: { en: '', ar: '' },
        order: pages.length,
        isActive: true
      });
      setActiveLanguageTab('en');
    }
  }, [showModal, editingPage, pages.length]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('title.') || name.startsWith('content.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const updated = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
        // Auto-generate slug from English title when creating new page
        if (name === 'title.en' && !editingPage && value) {
          updated.slug = generateSlug(value);
        }
        return updated;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
      }));
    }
  };

  // Handler for rich text editor content changes
  const handleContentChange = (content, language) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [language]: content
      }
    }));
  };

  const handleSlugChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      slug: generateSlug(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await api.put(`/pages/${editingPage._id}`, formData);
        toast.success('Page updated successfully');
      } else {
        await api.post('/pages', formData);
        toast.success('Page created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save page');
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug || '',
      title: {
        en: page.title?.en || '',
        ar: page.title?.ar || ''
      },
      content: {
        en: page.content?.en || '',
        ar: page.content?.ar || ''
      },
      order: page.order || 0,
      isActive: page.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/pages/${id}`);
      toast.success('Page deleted successfully');
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete page');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/pages/${id}/toggle`);
      toast.success('Page status updated');
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update page');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;

    const updatedPages = [...pages];
    const temp = updatedPages[index].order;
    updatedPages[index].order = updatedPages[index - 1].order;
    updatedPages[index - 1].order = temp;

    await updateOrder(updatedPages);
  };

  const handleMoveDown = async (index) => {
    if (index === pages.length - 1) return;

    const updatedPages = [...pages];
    const temp = updatedPages[index].order;
    updatedPages[index].order = updatedPages[index + 1].order;
    updatedPages[index + 1].order = temp;

    await updateOrder(updatedPages);
  };

  const updateOrder = async (updatedPages) => {
    try {
      const orderData = updatedPages.map((page) => ({
        id: page._id,
        order: page.order
      }));

      await api.patch('/pages/order/update', { pages: orderData });
      toast.success('Page order updated');
      fetchPages();
    } catch (error) {
      toast.error('Failed to update page order');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: { en: '', ar: '' },
      content: { en: '', ar: '' },
      order: 0,
      isActive: true
    });
    setEditingPage(null);
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = 
      page.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.title?.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.title?.ar?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div className="pages-container">Loading...</div>;
  }

  return (
    <div className="pages-container">
      <div className="pages-header">
        <div className="pages-header-left">
          <h2>Pages Management</h2>
          <p>Manage footer pages (Terms & Conditions, Privacy, Contact Us, etc.)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Add Page
        </button>
      </div>

      <div className="pages-filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={filterStatus === '' ? 'active' : ''}
            onClick={() => setFilterStatus('')}
          >
            All
          </button>
          <button
            className={filterStatus === 'active' ? 'active' : ''}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button
            className={filterStatus === 'inactive' ? 'active' : ''}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="pages-table-container">
        <table className="pages-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Slug</th>
              <th>Title (EN)</th>
              <th>Title (AR)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No pages found. Click "Add Page" to create one.
                </td>
              </tr>
            ) : (
              filteredPages.map((page, index) => (
                <tr key={page._id}>
                  <td>
                    <div className="order-controls">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="order-btn"
                      >
                        <FiArrowUp />
                      </button>
                      <span>{page.order}</span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredPages.length - 1}
                        className="order-btn"
                      >
                        <FiArrowDown />
                      </button>
                    </div>
                  </td>
                  <td>
                    <code className="slug-cell">{page.slug}</code>
                  </td>
                  <td>{page.title?.en || '-'}</td>
                  <td>{page.title?.ar || '-'}</td>
                  <td>
                    <span className={`status-badge ${page.isActive ? 'active' : 'inactive'}`}>
                      {page.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleToggle(page._id)}
                        className="btn-icon"
                        title={page.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {page.isActive ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={() => handleEdit(page)}
                        className="btn-icon"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(page._id)}
                        className="btn-icon danger"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPage ? 'Edit Page' : 'Create New Page'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="page-form">
              {/* Slug and Basic Settings */}
              <div className="form-section">
                <h4 className="section-title">Basic Information</h4>
                <div className="form-group">
                  <label>Slug *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    placeholder="terms-and-conditions"
                    required
                  />
                  <small>URL-friendly identifier (auto-generated from English title)</small>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Order</label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Language Tabs */}
              <div className="form-section">
                <h4 className="section-title">Page Content</h4>
                <div className="language-tabs">
                  <button
                    type="button"
                    className={`language-tab ${activeLanguageTab === 'en' ? 'active' : ''}`}
                    onClick={() => setActiveLanguageTab('en')}
                  >
                    <FiGlobe /> English
                  </button>
                  <button
                    type="button"
                    className={`language-tab ${activeLanguageTab === 'ar' ? 'active' : ''}`}
                    onClick={() => setActiveLanguageTab('ar')}
                  >
                    <FiGlobe /> العربية
                  </button>
                </div>

                {/* English Content */}
                <div className={`language-content ${activeLanguageTab === 'en' ? 'active' : ''}`}>
                  <div className="form-group">
                    <label>
                      Title (English) *
                      <span className="char-count">{formData.title.en.length} characters</span>
                    </label>
                    <input
                      type="text"
                      name="title.en"
                      value={formData.title.en}
                      onChange={handleInputChange}
                      placeholder="Terms & Conditions"
                      required
                      className="lang-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      Content (English) *
                      <span className="char-count">
                        {formData.content.en ? formData.content.en.replace(/<[^>]*>/g, '').length : 0} characters
                      </span>
                    </label>
                    <RichTextEditor
                      value={formData.content.en}
                      onChange={(content) => handleContentChange(content, 'en')}
                      placeholder="Enter page content in English. Use the toolbar to format your text."
                      language="en"
                    />
                    <small>
                      <strong>Rich Text Editor:</strong> Use the toolbar above to format text, add images, links, tables, and more.
                    </small>
                  </div>
                </div>

                {/* Arabic Content */}
                <div className={`language-content ${activeLanguageTab === 'ar' ? 'active' : ''}`}>
                  <div className="form-group">
                    <label>
                      العنوان (العربية) *
                      <span className="char-count">{formData.title.ar.length} حرف</span>
                    </label>
                    <input
                      type="text"
                      name="title.ar"
                      value={formData.title.ar}
                      onChange={handleInputChange}
                      placeholder="الشروط والأحكام"
                      required
                      className="lang-input lang-input-ar"
                      dir="rtl"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      المحتوى (العربية) *
                      <span className="char-count">
                        {formData.content.ar ? formData.content.ar.replace(/<[^>]*>/g, '').length : 0} حرف
                      </span>
                    </label>
                    <RichTextEditor
                      value={formData.content.ar}
                      onChange={(content) => handleContentChange(content, 'ar')}
                      placeholder="أدخل محتوى الصفحة بالعربية. استخدم شريط الأدوات لتنسيق النص."
                      language="ar"
                    />
                    <small>
                      <strong>محرر النص المنسق:</strong> استخدم شريط الأدوات أعلاه لتنسيق النص وإضافة الصور والروابط والجداول والمزيد.
                    </small>
                  </div>
                </div>
              </div>

              {/* Quick Preview Section */}
              <div className="form-section">
                <h4 className="section-title">Quick Preview</h4>
                <div className="preview-tabs">
                  <button
                    type="button"
                    className={`preview-tab ${activeLanguageTab === 'en' ? 'active' : ''}`}
                    onClick={() => setActiveLanguageTab('en')}
                  >
                    English Preview
                  </button>
                  <button
                    type="button"
                    className={`preview-tab ${activeLanguageTab === 'ar' ? 'active' : ''}`}
                    onClick={() => setActiveLanguageTab('ar')}
                  >
                    معاينة العربية
                  </button>
                </div>
                <div className="preview-content">
                  {activeLanguageTab === 'en' ? (
                    <div>
                      <h3 className="preview-title">{formData.title.en || 'Title will appear here...'}</h3>
                      <div 
                        className="preview-text"
                        dangerouslySetInnerHTML={{ 
                          __html: formData.content.en || '<p style="color: #9ca3af;">Content will appear here...</p>' 
                        }}
                      />
                    </div>
                  ) : (
                    <div dir="rtl">
                      <h3 className="preview-title">{formData.title.ar || 'سيظهر العنوان هنا...'}</h3>
                      <div 
                        className="preview-text"
                        dangerouslySetInnerHTML={{ 
                          __html: formData.content.ar || '<p style="color: #9ca3af;">سيظهر المحتوى هنا...</p>' 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPage ? 'Update' : 'Create'} Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pages;

