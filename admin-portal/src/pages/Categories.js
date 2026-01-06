import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiArrowUp, FiArrowDown, FiImage, FiX,
  FiShoppingBag, FiBriefcase, FiActivity, FiAward, FiTruck, FiGlobe, FiMonitor, FiZap,
  FiHome, FiPackage, FiGrid, FiLayers, FiTag, FiStar, FiHeart, FiShoppingCart,
  FiUser, FiUsers, FiSettings, FiTool, FiBox, FiArchive, FiFolder, FiFile,
  FiMail, FiPhone, FiMapPin, FiCalendar, FiClock, FiBell, FiMessageCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import getImageUrl from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';
import './Categories.css';

// Available icons for category selection
const AVAILABLE_ICONS = [
  { name: 'FiShoppingBag', component: FiShoppingBag, label: 'Shopping Bag' },
  { name: 'FiBriefcase', component: FiBriefcase, label: 'Briefcase' },
  { name: 'FiActivity', component: FiActivity, label: 'Activity' },
  { name: 'FiAward', component: FiAward, label: 'Award' },
  { name: 'FiTruck', component: FiTruck, label: 'Truck' },
  { name: 'FiGlobe', component: FiGlobe, label: 'Globe' },
  { name: 'FiMonitor', component: FiMonitor, label: 'Monitor' },
  { name: 'FiZap', component: FiZap, label: 'Zap' },
  { name: 'FiHome', component: FiHome, label: 'Home' },
  { name: 'FiPackage', component: FiPackage, label: 'Package' },
  { name: 'FiGrid', component: FiGrid, label: 'Grid' },
  { name: 'FiLayers', component: FiLayers, label: 'Layers' },
  { name: 'FiTag', component: FiTag, label: 'Tag' },
  { name: 'FiStar', component: FiStar, label: 'Star' },
  { name: 'FiHeart', component: FiHeart, label: 'Heart' },
  { name: 'FiShoppingCart', component: FiShoppingCart, label: 'Shopping Cart' },
  { name: 'FiUser', component: FiUser, label: 'User' },
  { name: 'FiUsers', component: FiUsers, label: 'Users' },
  { name: 'FiSettings', component: FiSettings, label: 'Settings' },
  { name: 'FiTool', component: FiTool, label: 'Tool' },
  { name: 'FiBox', component: FiBox, label: 'Box' },
  { name: 'FiArchive', component: FiArchive, label: 'Archive' },
  { name: 'FiFolder', component: FiFolder, label: 'Folder' },
  { name: 'FiFile', component: FiFile, label: 'File' },
  { name: 'FiMail', component: FiMail, label: 'Mail' },
  { name: 'FiPhone', component: FiPhone, label: 'Phone' },
  { name: 'FiMapPin', component: FiMapPin, label: 'Map Pin' },
  { name: 'FiCalendar', component: FiCalendar, label: 'Calendar' },
  { name: 'FiClock', component: FiClock, label: 'Clock' },
  { name: 'FiBell', component: FiBell, label: 'Bell' },
  { name: 'FiMessageCircle', component: FiMessageCircle, label: 'Message Circle' }
];

const Categories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // All hooks must be declared first
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: 'FiShoppingBag',
    order: 0,
    isActive: true
  });
  const [showIconSelector, setShowIconSelector] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const iconSelectorRef = useRef(null);
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  // Check if user has superAdmin or mallAdmin role
  useEffect(() => {
    if (user) {
      const userRole = user.role?.name || user.role;
      if (userRole !== 'superAdmin' && userRole !== 'mallAdmin') {
        toast.error('Access denied. Only administrators can access this page.');
        navigate('/');
      }
    }
  }, [user, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== '') params.isActive = filterStatus === 'active';

      const response = await api.get('/categories', { params });
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Close icon selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (iconSelectorRef.current && !iconSelectorRef.current.contains(event.target)) {
        setShowIconSelector(false);
      }
    };

    if (showIconSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIconSelector]);

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingCategory) {
      setFormData({
        name: '',
        description: '',
        image: '',
        icon: 'FiShoppingBag',
        order: categories.length,
        isActive: true
      });
      setImageFile(null);
      setImagePreview('');
      setShowIconSelector(false);
    }
  }, [showModal, editingCategory, categories.length]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('icon', formData.icon);
      submitData.append('order', formData.order);
      submitData.append('isActive', formData.isActive);

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (editingCategory && !formData.image) {
        // If editing and no new image and image was removed
        submitData.append('image', '');
      }

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Category created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || 'FiShoppingBag',
      order: category.order || 0,
      isActive: category.isActive
    });
    setImagePreview(category.image ? getImageUrl(category.image) : '');
    setImageFile(null);
    setShowIconSelector(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/categories/${id}/toggle`);
      toast.success('Category status updated');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;

    const updatedCategories = [...categories];
    const temp = updatedCategories[index].order;
    updatedCategories[index].order = updatedCategories[index - 1].order;
    updatedCategories[index - 1].order = temp;

    await updateOrder(updatedCategories);
  };

  const handleMoveDown = async (index) => {
    if (index === categories.length - 1) return;

    const updatedCategories = [...categories];
    const temp = updatedCategories[index].order;
    updatedCategories[index].order = updatedCategories[index + 1].order;
    updatedCategories[index + 1].order = temp;

    await updateOrder(updatedCategories);
  };

  const updateOrder = async (updatedCategories) => {
    try {
      const orderData = updatedCategories.map((cat, index) => ({
        id: cat._id,
        order: cat.order
      }));

      await api.patch('/categories/order/update', { categories: orderData });
      toast.success('Category order updated');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category order');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      icon: 'FiShoppingBag',
      order: 0,
      isActive: true
    });
    setImageFile(null);
    setImagePreview('');
    setShowIconSelector(false);
    setIconSearchTerm('');
    setEditingCategory(null);
  };

  const getSelectedIconComponent = () => {
    const iconData = AVAILABLE_ICONS.find(icon => icon.name === formData.icon);
    return iconData ? iconData.component : FiShoppingBag;
  };

  const handleIconSelect = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
    setShowIconSelector(false);
    setIconSearchTerm('');
  };

  const filteredIcons = AVAILABLE_ICONS.filter(icon =>
    icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
    icon.label.toLowerCase().includes(iconSearchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      order: categories.length
    }));
    setShowModal(true);
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchTerm || 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Don't render if user is not superAdmin or mallAdmin (after all hooks)
  if (user) {
    const userRole = user.role?.name || user.role;
    if (userRole !== 'superAdmin' && userRole !== 'mallAdmin') {
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

  if (loading) {
    return <div className="categories-page loading">Loading categories...</div>;
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <h2>Categories Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Category
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {filterStatus && (
            <button className="btn-clear" onClick={() => setFilterStatus('')}>
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Order</th>
              <th>Icon</th>
              <th>Category</th>
              <th>Description</th>
              <th>Image</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No categories found</td>
              </tr>
            ) : (
              filteredCategories.map((category, index) => (
                <tr key={category._id}>
                  <td>
                    <div className="order-controls">
                      <button
                        className="btn-order"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <FiArrowUp />
                      </button>
                      <span className="order-number">{category.order}</span>
                      <button
                        className="btn-order"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredCategories.length - 1}
                        title="Move down"
                      >
                        <FiArrowDown />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="category-icon-cell">
                      {(() => {
                        const iconData = AVAILABLE_ICONS.find(icon => icon.name === (category.icon || 'FiShoppingBag'));
                        const IconComponent = iconData ? iconData.component : FiShoppingBag;
                        return <IconComponent size={20} />;
                      })()}
                    </div>
                  </td>
                  <td>
                    <div className="category-name">{category.name}</div>
                  </td>
                  <td>
                    <div className="category-description">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td>
                    {category.image ? (
                      <img
                        src={getImageUrl(category.image)}
                        alt={category.name}
                        className="category-thumbnail"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="no-image">No image</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(category)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggle(category._id)}
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? '✓' : '✗'}
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(category._id)}
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
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  placeholder=""
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder=""
                />
              </div>
              <div className="form-group">
                <label>Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order || 0}
                  onChange={handleInputChange}
                  min="0"
                />
                <small className="form-hint">Lower numbers appear first in the frontend</small>
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-selector-wrapper" ref={iconSelectorRef}>
                  <button
                    type="button"
                    className="icon-selector-button"
                    onClick={() => setShowIconSelector(!showIconSelector)}
                  >
                    <span className="icon-preview">
                      {React.createElement(getSelectedIconComponent(), { size: 20 })}
                    </span>
                    <span className="icon-name">{formData.icon}</span>
                    <span className="icon-dropdown-arrow">▼</span>
                  </button>
                  {showIconSelector && (
                    <div className="icon-selector-dropdown">
                      <div className="icon-selector-search">
                        <input
                          type="text"
                          placeholder="Search icons..."
                          className="icon-search-input"
                          id="icon-search"
                          value={iconSearchTerm}
                          onChange={(e) => setIconSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="icon-grid">
                        {filteredIcons.map(icon => {
                          const IconComponent = icon.component;
                          return (
                            <button
                              key={icon.name}
                              type="button"
                              className={`icon-option ${formData.icon === icon.name ? 'selected' : ''}`}
                              onClick={() => handleIconSelect(icon.name)}
                              title={icon.label}
                            >
                              <IconComponent size={20} />
                              <span className="icon-option-label">{icon.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Image</label>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" className="btn-remove-image" onClick={removeImage}>
                      <FiX /> Remove
                    </button>
                  </div>
                )}
                {!imagePreview && (
                  <div className="image-upload">
                    <label className="upload-label">
                      <FiImage />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
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
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
