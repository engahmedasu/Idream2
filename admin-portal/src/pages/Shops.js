import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiImage, FiX, FiCheckCircle, FiXCircle, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Shops.css';

const Shops = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterApproval, setFilterApproval] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    address: '',
    category: '',
    priority: 0,
    productTypes: [],
    isActive: false,
    isApproved: false
  });
  const [newProductType, setNewProductType] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== '') params.isActive = filterStatus === 'active';
      if (filterCategory) params.category = filterCategory;
      if (searchTerm) params.search = searchTerm;

      const [shopsRes, categoriesRes] = await Promise.all([
        api.get('/shops', { params }),
        api.get('/categories?isActive=true')
      ]);
      
      let shopsData = shopsRes.data || [];
      
      // Filter by approval status if needed (client-side since backend doesn't support it)
      if (filterApproval !== '') {
        shopsData = shopsData.filter(shop => {
          if (filterApproval === 'approved') return shop.isApproved === true;
          if (filterApproval === 'pending') return shop.isApproved === false;
          return true;
        });
      }
      
      setShops(shopsData);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, filterApproval, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingShop) {
      setFormData({
        name: '',
        email: '',
        mobile: '',
        whatsapp: '',
        instagram: '',
        facebook: '',
        address: '',
        category: '',
        priority: 0,
        productTypes: [],
        isActive: false,
        isApproved: false
      });
      setNewProductType('');
      setImageFile(null);
      setImagePreview('');
    }
  }, [showModal, editingShop]);

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

  const handleAddProductType = () => {
    if (newProductType.trim() && !formData.productTypes.includes(newProductType.trim())) {
      setFormData(prev => ({
        ...prev,
        productTypes: [...prev.productTypes, newProductType.trim()]
      }));
      setNewProductType('');
    }
  };

  const handleRemoveProductType = (index) => {
    setFormData(prev => ({
      ...prev,
      productTypes: prev.productTypes.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Shop name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.mobile.trim()) {
      toast.error('Mobile number is required');
      return false;
    }
    if (!formData.whatsapp.trim()) {
      toast.error('WhatsApp number is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('mobile', formData.mobile);
      submitData.append('whatsapp', formData.whatsapp);
      submitData.append('instagram', formData.instagram || '');
      submitData.append('facebook', formData.facebook || '');
      submitData.append('address', formData.address);
      submitData.append('category', formData.category);
      submitData.append('priority', String(formData.priority || 0));
      submitData.append('productTypes', JSON.stringify(formData.productTypes || []));
      submitData.append('isActive', formData.isActive);
      submitData.append('isApproved', formData.isApproved);

      if (imageFile) {
        submitData.append('shopImage', imageFile);
      } else if (editingShop && !formData.image) {
        submitData.append('shopImage', '');
      }

      if (editingShop) {
        await api.put(`/shops/${editingShop._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Shop updated successfully');
      } else {
        await api.post('/shops', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Shop created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save shop');
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name || '',
      email: shop.email || '',
      mobile: shop.mobile || '',
      whatsapp: shop.whatsapp || '',
      instagram: shop.instagram || '',
      facebook: shop.facebook || '',
      address: shop.address || '',
      category: shop.category?._id || shop.category || '',
      priority: shop.priority || 0,
      productTypes: shop.productTypes || [],
      isActive: shop.isActive || false,
      isApproved: shop.isApproved || false
    });
    setNewProductType('');
    setImagePreview(shop.image ? `http://localhost:5000${shop.image}` : '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shop? This will also delete all associated products. This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/shops/${id}`);
      toast.success('Shop deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete shop');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/shops/${id}/activate`);
      toast.success('Shop verified and activated. User account has also been activated.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate shop');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/shops/${id}/deactivate`);
      toast.success('Shop deactivated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate shop');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobile: '',
      whatsapp: '',
      instagram: '',
      facebook: '',
      address: '',
      category: '',
      priority: 0,
      productTypes: [],
      isActive: false,
      isApproved: false
    });
    setImageFile(null);
    setImagePreview('');
    setEditingShop(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Search is handled by backend, but we can do additional client-side filtering if needed
  const filteredShops = shops || [];

  const isSuperAdmin = user?.role === 'superAdmin' || user?.role?.name === 'superAdmin';
  const isMallAdmin = user?.role === 'mallAdmin' || user?.role?.name === 'mallAdmin';

  // Count pending shops
  const pendingShopsCount = (shops || []).filter(shop => !shop.isApproved).length;

  if (loading) {
    return <div className="shops-page loading">Loading shops...</div>;
  }

  return (
    <div className="shops-page">
      <div className="page-header">
        <div>
          <h2>Shops Management</h2>
          {(isSuperAdmin || isMallAdmin) && pendingShopsCount > 0 && (
            <p style={{ color: '#dc2626', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <strong>{pendingShopsCount}</strong> shop{pendingShopsCount !== 1 ? 's' : ''} pending verification
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Shop
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search shops by name, email, mobile, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories && categories.length > 0 && categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-box">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {(isSuperAdmin || isMallAdmin) && (
          <div className="filter-box">
            <select value={filterApproval} onChange={(e) => setFilterApproval(e.target.value)}>
              <option value="">All Approval</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        )}
        {(filterStatus || filterCategory || filterApproval) && (
          <button className="btn-clear" onClick={() => {
            setFilterStatus('');
            setFilterCategory('');
            setFilterApproval('');
          }}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="shops-table">
          <thead>
            <tr>
              <th>Shop</th>
              <th>Contact</th>
              <th>Category</th>
              <th>Product Types</th>
              <th>Priority</th>
              <th>Address</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No shops found</td>
              </tr>
            ) : (
              filteredShops.map((shop) => (
                <tr key={shop._id} className={!shop.isApproved ? 'pending-shop-row' : ''}>
                  <td>
                    <div className="shop-info">
                      {shop.image ? (
                        <img
                          src={`http://localhost:5000${shop.image}`}
                          alt={shop.name}
                          className="shop-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="shop-thumbnail-placeholder">
                          <FiImage />
                        </div>
                      )}
                      <div className="shop-details">
                        <div className="shop-name">{shop.name}</div>
                        <div className="shop-email">
                          <FiMail /> {shop.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div><FiPhone /> {shop.mobile}</div>
                      <div className="whatsapp-link">
                        <a href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                          WhatsApp: {shop.whatsapp}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {shop.category?.name || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {shop.productTypes && shop.productTypes.length > 0 ? (
                      <div className="product-types-list">
                        {shop.productTypes.map((type, index) => (
                          <span key={index} className="product-type-tag-small">
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-badge">-</span>
                    )}
                  </td>
                  <td>
                    <span className="priority-badge">
                      {shop.priority || 0}
                    </span>
                  </td>
                  <td>
                    <div className="address-info">
                      <FiMapPin /> {shop.address || '-'}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${shop.isActive ? 'active' : 'inactive'}`}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {shop.isApproved ? (
                      <span className="approval-status approved">
                        <FiCheckCircle /> Verified
                      </span>
                    ) : (
                      <span className="approval-status pending" style={{ color: '#dc2626', fontWeight: '600' }}>
                        <FiXCircle /> Pending Verification
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(shop)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      {(isSuperAdmin || isMallAdmin) && (
                        <>
                          {shop.isActive ? (
                            <button
                              className="btn-icon"
                              onClick={() => handleDeactivate(shop._id)}
                              title="Deactivate"
                            >
                              <FiXCircle />
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              onClick={() => handleActivate(shop._id)}
                              title="Activate & Approve"
                            >
                              <FiCheckCircle />
                            </button>
                          )}
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDelete(shop._id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
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
            <h3>{editingShop ? 'Edit Shop' : 'Create Shop'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder=""
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder=""
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                    placeholder=""
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number *</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    required
                    placeholder=""
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="Instagram URL or username"
                  />
                </div>
                <div className="form-group">
                  <label>Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    placeholder="Facebook URL or username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder=""
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories && categories.length > 0 && categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority !== undefined && formData.priority !== null ? formData.priority : 0}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
                <small className="form-hint">Higher numbers appear first on the home screen</small>
              </div>

              <div className="form-group">
                <label>Product Types</label>
                <div className="product-types-input">
                  <input
                    type="text"
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProductType();
                      }
                    }}
                    placeholder="Enter product type (e.g., Men, Women, Kids)"
                  />
                  <button
                    type="button"
                    className="btn-add-type"
                    onClick={handleAddProductType}
                  >
                    <FiPlus /> Add
                  </button>
                </div>
                {formData.productTypes && formData.productTypes.length > 0 && (
                  <div className="product-types-list">
                    {formData.productTypes.map((type, index) => (
                      <span key={index} className="product-type-tag">
                        {type}
                        <button
                          type="button"
                          className="btn-remove-type"
                          onClick={() => handleRemoveProductType(index)}
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <small className="form-hint">Add product types that will be used as filters on the shop page (e.g., Men, Women, Kids, Bags, Apparel, Footwear)</small>
              </div>

              <div className="form-group">
                <label>Shop Image</label>
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

              <div className="form-row">
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
                {isSuperAdmin && (
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isApproved"
                        checked={formData.isApproved}
                        onChange={handleInputChange}
                      />
                      Approved
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingShop ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;
