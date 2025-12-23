import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiImage, FiX, FiCheckCircle, FiXCircle, FiTag, FiTruck, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Products.css';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShop, setFilterShop] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterHotOffer, setFilterHotOffer] = useState('');
  const [filterApproval, setFilterApproval] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    shippingFees: 0,
    shop: '',
    category: '',
    priority: 0,
    productType: '',
    isHotOffer: false,
    shippingTitle: '',
    shippingDescription: '',
    warrantyTitle: '',
    warrantyDescription: '',
    imageQualityComment: '',
    isActive: false,
    isApproved: false
  });
  const [availableProductTypes, setAvailableProductTypes] = useState([]);
  const [limitsStatus, setLimitsStatus] = useState({
    canCreateProduct: true,
    canSetHotOffer: true,
    maxProducts: null,
    maxHotOffers: null,
    currentProducts: 0,
    currentHotOffers: 0
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Auto-set shop filter for shopAdmin users
  useEffect(() => {
    if (user && user.role?.name === 'shopAdmin' && user.shop && !filterShop) {
      setFilterShop(user.shop);
    }
  }, [user, filterShop]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== '') params.isActive = filterStatus === 'active';
      if (filterShop) params.shop = filterShop;
      if (filterCategory) params.category = filterCategory;
      if (filterHotOffer !== '') params.isHotOffer = filterHotOffer === 'true';
      if (searchTerm) params.search = searchTerm;

      const [productsRes, shopsRes, categoriesRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/shops?isActive=true'),
        api.get('/categories?isActive=true')
      ]);
      
      let productsData = productsRes.data;
      
      // Filter by approval status if needed
      if (filterApproval !== '') {
        productsData = productsData.filter(product => {
          if (filterApproval === 'approved') return product.isApproved === true;
          if (filterApproval === 'pending') return product.isApproved === false;
          return true;
        });
      }
      
      setProducts(productsData);
      setShops(shopsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterShop, filterCategory, filterHotOffer, filterApproval, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch limits status when modal opens
  useEffect(() => {
    if (showModal) {
      const shopId = formData.shop || (user && user.role?.name === 'shopAdmin' && user.shop ? user.shop : '');
      if (shopId) {
        fetchLimitsStatus(shopId);
      }
    }
  }, [showModal]);

  const fetchLimitsStatus = async (shopId) => {
    try {
      const response = await api.get(`/products/limits/status?shopId=${shopId}`);
      setLimitsStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch limits status:', error);
      // Default to allowing everything if fetch fails
      setLimitsStatus({
        canCreateProduct: true,
        canSetHotOffer: true,
        maxProducts: null,
        maxHotOffers: null,
        currentProducts: 0,
        currentHotOffers: 0
      });
    }
  };

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingProduct) {
      // Auto-set shop for shopAdmin users
      const defaultShop = (user && user.role?.name === 'shopAdmin' && user.shop) ? user.shop : '';
      
      // Load product types if shop is selected
      if (defaultShop) {
        const selectedShop = shops.find(s => s._id === defaultShop);
        if (selectedShop && selectedShop.productTypes) {
          setAvailableProductTypes(selectedShop.productTypes);
        } else {
          setAvailableProductTypes([]);
        }
      } else {
        setAvailableProductTypes([]);
      }
      
      setFormData({
        name: '',
        description: '',
        price: '',
        shippingFees: 0,
        shop: defaultShop,
        category: '',
        priority: 0,
        productType: '',
        isHotOffer: false,
        shippingTitle: '',
        shippingDescription: '',
        warrantyTitle: '',
        warrantyDescription: '',
        imageQualityComment: '',
        isActive: false,
        isApproved: false
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [showModal, editingProduct, user, shops]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : (isNaN(parseFloat(value)) ? '' : parseFloat(value))) : value)
    }));

    // When shop changes, update available product types and fetch limits
    if (name === 'shop' && value) {
      const selectedShop = shops.find(s => s._id === value);
      if (selectedShop && selectedShop.productTypes) {
        setAvailableProductTypes(selectedShop.productTypes);
      } else {
        setAvailableProductTypes([]);
      }
      // Reset productType when shop changes
      setFormData(prev => ({ ...prev, productType: '' }));
      // Fetch limits status for the selected shop
      fetchLimitsStatus(value);
    }
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Product price must be greater than 0');
      return false;
    }
    if (!formData.shop) {
      toast.error('Shop is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }
    // Check product limit
    if (!limitsStatus.canCreateProduct) {
      toast.error('You reach max number of products to be active based on shop subscription plan');
      return false;
    }
    // Check hot offer limit if trying to set as hot offer
    if (formData.isHotOffer && !limitsStatus.canSetHotOffer) {
      toast.error('You reach max number of hot offers for this shop subscription plan');
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
      submitData.append('description', formData.description);
      submitData.append('price', String(formData.price));
      submitData.append('shippingFees', String(formData.shippingFees || 0));
      submitData.append('shop', formData.shop);
      submitData.append('category', formData.category);
      submitData.append('priority', String(formData.priority || 0));
      submitData.append('productType', formData.productType || '');
      submitData.append('isHotOffer', formData.isHotOffer);
      submitData.append('shippingTitle', formData.shippingTitle || '');
      submitData.append('shippingDescription', formData.shippingDescription || '');
      submitData.append('warrantyTitle', formData.warrantyTitle || '');
      submitData.append('warrantyDescription', formData.warrantyDescription || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('isApproved', formData.isApproved);

      if (imageFile) {
        submitData.append('productImage', imageFile);
      } else if (editingProduct && !formData.image) {
        submitData.append('productImage', '');
      }

      if (isSuperAdmin && formData.imageQualityComment) {
        submitData.append('imageQualityComment', formData.imageQualityComment);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = async (product) => {
    setEditingProduct(product);
    const shopId = product.shop?._id || product.shop || '';
    const selectedShop = shops.find(s => s._id === shopId);
    if (selectedShop && selectedShop.productTypes) {
      setAvailableProductTypes(selectedShop.productTypes);
    } else {
      setAvailableProductTypes([]);
    }
    
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      shippingFees: typeof product.shippingFees === 'number' ? product.shippingFees : 0,
      shop: shopId,
      category: product.category?._id || product.category || '',
      priority: product.priority || 0,
      productType: product.productType || '',
      isHotOffer: product.isHotOffer || false,
      shippingTitle: product.shippingTitle || '',
      shippingDescription: product.shippingDescription || '',
      warrantyTitle: product.warrantyTitle || '',
      warrantyDescription: product.warrantyDescription || '',
      imageQualityComment: product.imageQualityComment || '',
      isActive: product.isActive || false,
      isApproved: product.isApproved || false
    });
    setImagePreview(product.image ? `http://localhost:5000${product.image}` : '');
    setImageFile(null);
    setShowModal(true);
    
    // Fetch limits for the shop
    if (shopId) {
      fetchLimitsStatus(shopId);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/products/${id}/activate`);
      toast.success('Product activated and approved');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate product');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/products/${id}/deactivate`);
      toast.success('Product deactivated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deactivate product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      shippingFees: 0,
      shop: '',
      category: '',
      priority: 0,
      productType: '',
      isHotOffer: false,
      shippingTitle: '',
      shippingDescription: '',
      warrantyTitle: '',
      warrantyDescription: '',
      imageQualityComment: '',
      isActive: false,
      isApproved: false
    });
    setAvailableProductTypes([]);
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredProducts = products;

  const isSuperAdmin = user?.role === 'superAdmin' || user?.role?.name === 'superAdmin';
  const isMallAdmin = user?.role === 'mallAdmin' || user?.role?.name === 'mallAdmin';
  const isShopAdmin = user?.role === 'shopAdmin' || user?.role?.name === 'shopAdmin';

  if (loading) {
    return <div className="products-page loading">Loading products...</div>;
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>Products Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Product
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!isShopAdmin && (
          <div className="filter-box">
            <select value={filterShop} onChange={(e) => setFilterShop(e.target.value)}>
              <option value="">All Shops</option>
              {shops.map(shop => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="filter-box">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-box">
          <select value={filterHotOffer} onChange={(e) => setFilterHotOffer(e.target.value)}>
            <option value="">All Products</option>
            <option value="true">Hot Offers</option>
            <option value="false">Regular Products</option>
          </select>
        </div>
        <div className="filter-box">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {isSuperAdmin && (
          <div className="filter-box">
            <select value={filterApproval} onChange={(e) => setFilterApproval(e.target.value)}>
              <option value="">All Approval</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        )}
        {(filterStatus || (!isShopAdmin && filterShop) || filterCategory || filterHotOffer || filterApproval) && (
          <button className="btn-clear" onClick={() => {
            setFilterStatus('');
            if (!isShopAdmin) setFilterShop('');
            setFilterCategory('');
            setFilterHotOffer('');
            setFilterApproval('');
          }}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Shop</th>
              <th>Category</th>
              <th>Product Type</th>
              <th>Price</th>
              <th>Shipping Fees</th>
              <th>Priority</th>
              <th>Hot Offer</th>
              <th>Status</th>
              <th>Approval</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">No products found</td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-info">
                      {product.image ? (
                        <img
                          src={`http://localhost:5000${product.image}`}
                          alt={product.name}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="product-thumbnail-placeholder">
                          <FiImage />
                        </div>
                      )}
                      <div className="product-details">
                        <div className="product-name">{product.name}</div>
                        <div className="product-description">
                          {product.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="shop-badge">
                      {product.shop?.name || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="category-badge">
                      {product.category?.name || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {product.productType ? (
                      <span className="product-type-badge">
                        {product.productType}
                      </span>
                    ) : (
                      <span className="no-badge">-</span>
                    )}
                  </td>
                  <td>
                    <div className="price-info">
                      {product.price?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td>
                    <div className="price-info">
                      {(product.shippingFees ?? 0).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <span className="priority-badge">
                      {product.priority || 0}
                    </span>
                  </td>
                  <td>
                    {product.isHotOffer ? (
                      <span className="hot-offer-badge">
                        <FiTag /> Hot Offer
                      </span>
                    ) : (
                      <span className="no-badge">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {product.isApproved ? (
                      <span className="approval-status approved">
                        <FiCheckCircle /> Approved
                      </span>
                    ) : (
                      <span className="approval-status pending">
                        <FiXCircle /> Pending
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(product)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      {(isSuperAdmin || isMallAdmin || isShopAdmin) && (
                        <>
                          {product.isActive ? (
                            <button
                              className="btn-icon"
                              onClick={() => handleDeactivate(product._id)}
                              title="Deactivate"
                            >
                              <FiXCircle />
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              onClick={() => handleActivate(product._id)}
                              title="Activate & Approve"
                            >
                              <FiCheckCircle />
                            </button>
                          )}
                          {(isSuperAdmin || isMallAdmin) && (
                            <button
                              className="btn-icon danger"
                              onClick={() => handleDelete(product._id)}
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          )}
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
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Create Product'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
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
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder=""
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Shop *</label>
                  {isShopAdmin ? (
                    <input
                      type="text"
                      value={shops.find(s => s._id === formData.shop)?.name || 'Your Shop'}
                      readOnly
                      disabled
                      style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                  ) : (
                    <select
                      name="shop"
                      value={formData.shop}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a shop</option>
                      {shops.map(shop => (
                        <option key={shop._id} value={shop._id}>{shop.name}</option>
                      ))}
                    </select>
                  )}
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
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {availableProductTypes.length > 0 && (
                <div className="form-group">
                  <label>Product Type</label>
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a product type (optional)</option>
                    {availableProductTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                  <small className="form-hint">Filter products by type on the shop page</small>
                </div>
              )}

              <div className="form-row">
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
                  <small className="form-hint">Higher numbers appear first</small>
                </div>
                {/* Show checkbox if limit not reached, or if editing a product that's already a hot offer (allow unchecking) */}
                {(limitsStatus.canSetHotOffer || formData.isHotOffer) && (
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isHotOffer"
                        checked={formData.isHotOffer}
                        onChange={(e) => {
                          // Prevent checking if limit is reached
                          if (e.target.checked && !limitsStatus.canSetHotOffer) {
                            toast.error('You reach max number of hot offers for this shop subscription plan');
                            return;
                          }
                          handleInputChange(e);
                        }}
                        disabled={formData.isHotOffer ? false : !limitsStatus.canSetHotOffer}
                      />
                      <FiTag /> Set as Hot Offer
                    </label>
                  </div>
                )}
                {!limitsStatus.canSetHotOffer && limitsStatus.maxHotOffers !== null && !formData.isHotOffer && (
                  <div className="form-group">
                    <div className="limit-message">
                      <strong>Hot Offer Limit Reached:</strong> You have reached the maximum number of hot offers ({limitsStatus.maxHotOffers}) for this shop subscription plan.
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Product Image *</label>
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
                        required={!editingProduct}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="form-section-divider">
                <h4><FiTruck /> Shipping Information</h4>
              </div>

              <div className="form-group">
                <label>Shipping Title</label>
                <input
                  type="text"
                  name="shippingTitle"
                  value={formData.shippingTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Free Shipping"
                />
              </div>

              <div className="form-group">
                <label>Shipping Description</label>
                <textarea
                  name="shippingDescription"
                  value={formData.shippingDescription}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Shipping details and terms"
                />
              </div>

              <div className="form-group">
                <label>Shipping Fees</label>
                <input
                  type="number"
                  name="shippingFees"
                  value={formData.shippingFees}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <small className="form-hint">Set to 0 for free shipping</small>
              </div>

              <div className="form-section-divider">
                <h4><FiShield /> Warranty Information</h4>
              </div>

              <div className="form-group">
                <label>Warranty Title</label>
                <input
                  type="text"
                  name="warrantyTitle"
                  value={formData.warrantyTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., 1 Year Warranty"
                />
              </div>

              <div className="form-group">
                <label>Warranty Description</label>
                <textarea
                  name="warrantyDescription"
                  value={formData.warrantyDescription}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Warranty terms and conditions"
                />
              </div>

              {isSuperAdmin && (
                <>
                  <div className="form-section-divider">
                    <h4>Admin Comments</h4>
                  </div>
                  <div className="form-group">
                    <label>Image Quality Comment</label>
                    <textarea
                      name="imageQualityComment"
                      value={formData.imageQualityComment}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Comments about product image quality"
                    />
                  </div>
                </>
              )}

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
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
