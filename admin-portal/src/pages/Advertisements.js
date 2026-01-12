import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiImage, FiX, FiExternalLink
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import getImageUrl from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';
import './Advertisements.css';

const Advertisements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSide, setFilterSide] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    imageUrl: '',
    side: 'left',
    isActive: true,
    startDate: '',
    endDate: '',
    redirectUrl: '',
    priority: 0,
    categories: []
  });
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Check if user has superAdmin role
  useEffect(() => {
    if (user) {
      const userRole = user.role?.name || user.role;
      if (userRole !== 'superAdmin') {
        toast.error('Access denied. Only super administrators can access this page.');
        navigate('/');
      }
    }
  }, [user, navigate]);

  const fetchAdvertisements = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterSide) params.side = filterSide;
      if (filterStatus !== '') params.isActive = filterStatus === 'active';
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/advertisements', { params });
      setAdvertisements(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Access denied. Only super administrators can access advertisements.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to access this page');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch advertisements');
      }
      console.error('Error fetching advertisements:', error);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterSide, filterStatus, searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories?isActive=true');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    // Only fetch data if user is superAdmin
    if (user) {
      const userRole = user.role?.name || user.role;
      if (userRole === 'superAdmin') {
        fetchAdvertisements();
        fetchCategories();
      }
    }
  }, [user, fetchAdvertisements, fetchCategories]);

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingAd) {
      setFormData({
        imageUrl: '',
        side: 'left',
        isActive: true,
        startDate: '',
        endDate: '',
        redirectUrl: '',
        priority: advertisements.length,
        categories: []
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [showModal, editingAd, advertisements.length]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and WebP images are allowed');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const currentCategories = prev.categories || [];
      const isSelected = currentCategories.includes(categoryId);
      
      return {
        ...prev,
        categories: isSelected
          ? currentCategories.filter(id => id !== categoryId)
          : [...currentCategories, categoryId]
      };
    });
  };

  const handleSelectAllCategories = () => {
    if (categories.length === 0) return;
    
    setFormData(prev => {
      const currentCategories = prev.categories || [];
      const allSelected = categories.every(cat => currentCategories.includes(cat._id));
      
      return {
        ...prev,
        categories: allSelected ? [] : categories.map(cat => cat._id)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (!imageFile && !formData.imageUrl) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    try {
      const submitData = new FormData();
      
      if (imageFile) {
        submitData.append('advertisementImage', imageFile);
      } else if (formData.imageUrl) {
        submitData.append('imageUrl', formData.imageUrl);
      }

      submitData.append('side', formData.side);
      submitData.append('isActive', formData.isActive);
      submitData.append('categories', JSON.stringify(formData.categories));
      submitData.append('priority', formData.priority);
      
      if (formData.startDate) {
        submitData.append('startDate', formData.startDate);
      }
      if (formData.endDate) {
        submitData.append('endDate', formData.endDate);
      }
      if (formData.redirectUrl) {
        submitData.append('redirectUrl', formData.redirectUrl);
      }

      if (editingAd) {
        await api.put(`/advertisements/${editingAd._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Advertisement updated successfully');
      } else {
        await api.post('/advertisements', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Advertisement created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchAdvertisements();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Access denied. Only super administrators can manage advertisements.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to perform this action');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save advertisement');
      }
      console.error('Error saving advertisement:', error);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      imageUrl: ad.image || '',
      side: ad.side,
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
      redirectUrl: ad.redirectUrl || '',
      priority: ad.priority || 0,
      categories: ad.categories ? ad.categories.map(cat => typeof cat === 'object' ? cat._id : cat) : []
    });
    setImagePreview(ad.image ? getImageUrl(ad.image) : '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advertisement? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/advertisements/${id}`);
      toast.success('Advertisement deleted successfully');
      fetchAdvertisements();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Access denied. Only super administrators can delete advertisements.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to perform this action');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete advertisement');
      }
      console.error('Error deleting advertisement:', error);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/advertisements/${id}/toggle-status`);
      toast.success('Advertisement status updated');
      fetchAdvertisements();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Access denied. Only super administrators can update advertisements.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to perform this action');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update advertisement');
      }
      console.error('Error updating advertisement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      side: 'left',
      isActive: true,
      startDate: '',
      endDate: '',
      redirectUrl: '',
      priority: 0,
      categories: []
    });
    setImageFile(null);
    setImagePreview('');
    setEditingAd(null);
  };

  const openCreateModal = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      priority: advertisements.length
    }));
    setShowModal(true);
  };

  const filteredAds = advertisements.filter(ad => {
    const matchesSearch = !searchTerm || 
      ad.redirectUrl?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Don't render if user is not superAdmin
  if (user) {
    const userRole = user.role?.name || user.role;
    if (userRole !== 'superAdmin') {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      );
    }
  }

  return (
    <div className="advertisements-page">
      <div className="page-header">
        <h2>Advertisements</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Advertisement
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by redirect URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-box">
          <select value={filterSide} onChange={(e) => setFilterSide(e.target.value)}>
            <option value="">All Sides</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div className="filter-box">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {(filterCategory || filterSide || filterStatus || searchTerm) && (
          <button className="btn-clear" onClick={() => {
            setFilterCategory('');
            setFilterSide('');
            setFilterStatus('');
            setSearchTerm('');
          }}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading advertisements...</div>
      ) : filteredAds.length === 0 ? (
        <div className="empty-state">
          <p>No advertisements found</p>
        </div>
      ) : (
        <div className="advertisements-table-container">
          <table className="advertisements-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Side</th>
                <th>Categories</th>
                <th>Redirect URL</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => (
                <tr key={ad._id}>
                  <td>
                    {ad.image ? (
                      <img 
                        src={getImageUrl(ad.image)} 
                        alt="Advertisement" 
                        className="ad-thumbnail"
                      />
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No image</span>
                    )}
                  </td>
                  <td>
                    <span className={`side-badge ${ad.side}`}>
                      {ad.side === 'left' ? 'Left' : 'Right'}
                    </span>
                  </td>
                  <td>
                    {ad.categories && ad.categories.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {ad.categories.map((cat, idx) => (
                          <span key={idx} className="category-badge">
                            {typeof cat === 'object' ? cat.name : cat}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No categories</span>
                    )}
                  </td>
                  <td>
                    {ad.redirectUrl ? (
                      <a 
                        href={ad.redirectUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="redirect-link"
                      >
                        <FiExternalLink /> {ad.redirectUrl.length > 30 ? ad.redirectUrl.substring(0, 30) + '...' : ad.redirectUrl}
                      </a>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No URL</span>
                    )}
                  </td>
                  <td>
                    {ad.startDate ? new Date(ad.startDate).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : '-'}
                  </td>
                  <td>{ad.priority || 0}</td>
                  <td>
                    <span className={`status-badge ${ad.isActive ? 'active' : 'inactive'}`}>
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleToggle(ad._id)}
                        title={ad.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {ad.isActive ? '✓' : '✗'}
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(ad)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        className="btn-icon btn-danger" 
                        onClick={() => handleDelete(ad._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAd ? 'Edit Advertisement' : 'Create Advertisement'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Image *</label>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" className="btn-remove-image" onClick={handleRemoveImage}>
                      <FiX /> Remove
                    </button>
                  </div>
                )}
                {!imagePreview && (
                  <div className="image-upload">
                    <label className="upload-label">
                      <FiImage />
                      <span>Choose Image (JPG, PNG, WebP)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
                {!imagePreview && (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Or enter image URL"
                    />
                  </div>
                )}
                <small className="form-hint">Recommended: 300×600 px minimum (vertical orientation)</small>
              </div>

              <div className="form-group">
                <label>Display Side *</label>
                <select
                  name="side"
                  value={formData.side}
                  onChange={handleInputChange}
                  required
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div className="form-group">
                <div className="categories-section">
                  <div className="categories-header">
                    <label>Categories *</label>
                    <button
                      type="button"
                      className="btn-select-all"
                      onClick={handleSelectAllCategories}
                    >
                      {categories.length > 0 && formData.categories?.length === categories.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                  <div className="categories-container">
                    {categories.length === 0 ? (
                      <div className="categories-empty">
                        <p>No categories available. Please create categories first.</p>
                      </div>
                    ) : (
                      categories.map(category => {
                        const isSelected = formData.categories?.includes(category._id) || false;
                        return (
                          <div
                            key={category._id}
                            className={`category-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleCategoryToggle(category._id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCategoryToggle(category._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="category-name">{category.name}</span>
                            {category.description && (
                              <span className="category-description">{category.description}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {formData.categories && formData.categories.length > 0 && (
                    <div className="selected-count">
                      {formData.categories.length} categor{formData.categories.length === 1 ? 'y' : 'ies'} selected
                    </div>
                  )}
                </div>
                <small className="form-hint">Select one or more categories for this advertisement</small>
              </div>

              <div className="form-group">
                <label>Redirect URL</label>
                <input
                  type="url"
                  name="redirectUrl"
                  value={formData.redirectUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
                <small className="form-hint">URL to redirect when advertisement is clicked (optional)</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                  <small className="form-hint">Optional start date</small>
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                  <small className="form-hint">Optional end date</small>
                </div>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  min="0"
                />
                <small className="form-hint">Higher numbers appear first</small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAd ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advertisements;
