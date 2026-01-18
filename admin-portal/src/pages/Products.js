import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiImage, FiX, FiCheckCircle, FiXCircle, FiTag, FiTruck, FiShield, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import getImageUrl from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';
import config from '../config/app';
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
    productType: [],
    isHotOffer: false,
    shippingTitle: '',
    shippingDescription: '',
    warrantyTitle: '',
    warrantyDescription: '',
    imageQualityComment: '',
    isActive: false,
    isApproved: false,
    averageRating: ''
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

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    description: '',
    price: '',
    shop: '',
    category: '',
    image: ''
  });

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
  }, [showModal, formData.shop, user]);

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
      const isShopAdmin = user && (user.role?.name === 'shopAdmin' || user.role === 'shopAdmin');
      
      // Auto-set shop for shopAdmin users
      const defaultShop = (isShopAdmin && user.shop) ? user.shop : '';
      
      // Auto-set category from shop's category for shopAdmin users
      let defaultCategory = '';
      if (defaultShop) {
        const selectedShop = shops.find(s => s._id === defaultShop);
        if (selectedShop) {
          // Set category from shop's category
          if (selectedShop.category) {
            defaultCategory = selectedShop.category._id || selectedShop.category;
          }
          // Load product types if shop is selected
          if (selectedShop.productTypes) {
            setAvailableProductTypes(selectedShop.productTypes);
          } else {
            setAvailableProductTypes([]);
          }
        } else {
          // Shop not found in list yet, but still set the shop ID
          // Category will be set when shops are loaded (dependency array includes shops)
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
        category: defaultCategory,
        priority: 0,
        productType: [],
        isHotOffer: false,
        shippingTitle: '',
        shippingDescription: '',
        warrantyTitle: '',
        warrantyDescription: '',
        imageQualityComment: '',
        isActive: false,
        isApproved: false,
        averageRating: ''
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [showModal, editingProduct, user, shops]);

  // Update category when shops are loaded for shopAdmin
  useEffect(() => {
    const isShopAdmin = user && (user.role?.name === 'shopAdmin' || user.role === 'shopAdmin');
    if (showModal && !editingProduct && isShopAdmin && user.shop && formData.shop === user.shop && !formData.category) {
      const selectedShop = shops.find(s => s._id === user.shop);
      if (selectedShop && selectedShop.category) {
        const shopCategoryId = selectedShop.category._id || selectedShop.category;
        setFormData(prev => ({
          ...prev,
          category: shopCategoryId
        }));
      }
    }
  }, [shops, showModal, editingProduct, user, formData.shop, formData.category]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : (isNaN(parseFloat(value)) ? '' : parseFloat(value))) : value)
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // When shop changes, update available product types and fetch limits
    if (name === 'shop' && value) {
      const selectedShop = shops.find(s => s._id === value);
      if (selectedShop && selectedShop.productTypes) {
        setAvailableProductTypes(selectedShop.productTypes);
      } else {
        setAvailableProductTypes([]);
      }
      // Reset productType when shop changes
      setFormData(prev => ({ ...prev, productType: [] }));
      // Fetch limits status for the selected shop
      fetchLimitsStatus(value);
    }
  };

  const handleProductTypeChange = (type) => {
    setFormData(prev => {
      const currentTypes = prev.productType || [];
      if (currentTypes.includes(type)) {
        // Remove type if already selected
        return { ...prev, productType: currentTypes.filter(t => t !== type) };
      } else {
        // Add type if not selected
        return { ...prev, productType: [...currentTypes, type] };
      }
    });
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
      
      // Clear validation error for image when file is selected
      if (validationErrors.image) {
        setValidationErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const validateForm = () => {
    const errors = {
      name: '',
      description: '',
      price: '',
      shop: '',
      category: '',
      image: ''
    };
    let hasErrors = false;

    // Validate name
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Product name is required';
      hasErrors = true;
    }

    // Validate description
    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Product description is required';
      hasErrors = true;
    }

    // Validate price
    if (!formData.price || formData.price === '' || parseFloat(formData.price) <= 0) {
      errors.price = 'Product price must be greater than 0';
      hasErrors = true;
    }

    // Validate shop
    if (!formData.shop) {
      errors.shop = 'Shop is required';
      hasErrors = true;
    }

    // Validate category
    if (!formData.category) {
      errors.category = 'Category is required';
      hasErrors = true;
    }

    // Validate image (required for create, optional for update)
    if (!editingProduct && !imageFile && !formData.image) {
      errors.image = 'Product image is required';
      hasErrors = true;
    }

    setValidationErrors(errors);

    // Show toast for subscription limits (these are separate from field validation)
    if (!limitsStatus.canCreateProduct) {
      toast.error('You reach max number of products to be active based on shop subscription plan');
      hasErrors = true;
    }
    if (formData.isHotOffer && !limitsStatus.canSetHotOffer) {
      toast.error('You reach max number of hot offers for this shop subscription plan');
      hasErrors = true;
    }

    if (hasErrors) {
      // Scroll to first error field
      const firstErrorField = document.querySelector('.form-group input.error, .form-group textarea.error, .form-group select.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
    }

    return !hasErrors;
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
      submitData.append('productType', JSON.stringify(formData.productType || []));
      submitData.append('isHotOffer', formData.isHotOffer);
      submitData.append('shippingTitle', formData.shippingTitle || '');
      submitData.append('shippingDescription', formData.shippingDescription || '');
      submitData.append('warrantyTitle', formData.warrantyTitle || '');
      submitData.append('warrantyDescription', formData.warrantyDescription || '');
      submitData.append('isActive', formData.isActive);
      submitData.append('isApproved', formData.isApproved);

      // Add rating if provided (only for SuperAdmin, MallAdmin, ShopAdmin)
      if ((isSuperAdmin || isMallAdmin || isShopAdmin) && formData.averageRating !== '' && formData.averageRating !== undefined && formData.averageRating !== null) {
        submitData.append('averageRating', String(formData.averageRating));
      }

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
    const isShopAdmin = user?.role === 'shopAdmin' || user?.role?.name === 'shopAdmin';
    
    setEditingProduct(product);
    
    // For shopAdmin, always use their shop, not the product's shop
    const shopId = (isShopAdmin && user.shop) ? user.shop : (product.shop?._id || product.shop || '');
    const selectedShop = shops.find(s => s._id === shopId);
    if (selectedShop && selectedShop.productTypes) {
      setAvailableProductTypes(selectedShop.productTypes);
    } else {
      setAvailableProductTypes([]);
    }
    
    // For shopAdmin, ensure category matches shop's category (can't be changed)
    let productCategory = product.category?._id || product.category || '';
    if (isShopAdmin && selectedShop && selectedShop.category) {
      const shopCategoryId = selectedShop.category._id || selectedShop.category;
      // Override with shop's category for shopAdmin
      productCategory = shopCategoryId;
    }
    
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      shippingFees: typeof product.shippingFees === 'number' ? product.shippingFees : 0,
      shop: shopId,
      category: productCategory,
      priority: product.priority || 0,
      productType: Array.isArray(product.productType) ? product.productType : (product.productType ? [product.productType] : []),
      isHotOffer: product.isHotOffer || false,
      shippingTitle: product.shippingTitle || '',
      shippingDescription: product.shippingDescription || '',
      warrantyTitle: product.warrantyTitle || '',
      warrantyDescription: product.warrantyDescription || '',
      imageQualityComment: product.imageQualityComment || '',
      isActive: product.isActive || false,
      isApproved: product.isApproved || false,
      averageRating: product.averageRating || ''
    });
    setImagePreview(product.image ? getImageUrl(product.image) : '');
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
      productType: [],
      isHotOffer: false,
      shippingTitle: '',
      shippingDescription: '',
      warrantyTitle: '',
      warrantyDescription: '',
      imageQualityComment: '',
      isActive: false,
      isApproved: false,
      averageRating: ''
    });
    setValidationErrors({
      name: '',
      description: '',
      price: '',
      shop: '',
      category: '',
      image: ''
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
                <th>Rating</th>
                <th>Status</th>
                <th>Approval</th>
                <th>View in Portal</th>
                <th>Actions</th>
              </tr>
            </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="13" className="no-data">No products found</td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-info">
                      {product.image ? (
                        <img
                          src={getImageUrl(product.image)}
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
                    {product.productType && (Array.isArray(product.productType) ? product.productType.length > 0 : product.productType) ? (
                      <div className="product-types-container">
                        {Array.isArray(product.productType) ? (
                          product.productType.map((type, index) => (
                            <span key={index} className="product-type-badge">
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="product-type-badge">
                            {product.productType}
                          </span>
                        )}
                      </div>
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
                    {product.averageRating !== undefined && product.averageRating !== null && product.averageRating > 0 ? (
                      <div className="rating-display">
                        <span className="rating-value">{product.averageRating.toFixed(1)}</span>
                        <span className="rating-stars">⭐</span>
                        {product.totalReviews > 0 && (
                          <span className="rating-reviews">({product.totalReviews})</span>
                        )}
                      </div>
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
                    {product._id ? (
                      <a
                        href={`${config.frontendPortalURL}/product/${product._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                        title="View product in frontend portal"
                      >
                        <FiExternalLink /> View
                      </a>
                    ) : (
                      <span className="no-badge">-</span>
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
                    className={validationErrors.name ? 'error' : ''}
                  />
                  {validationErrors.name && (
                    <small className="form-error">{validationErrors.name}</small>
                  )}
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
                    className={validationErrors.price ? 'error' : ''}
                  />
                  {validationErrors.price && (
                    <small className="form-error">{validationErrors.price}</small>
                  )}
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
                  className={validationErrors.description ? 'error' : ''}
                />
                {validationErrors.description && (
                  <small className="form-error">{validationErrors.description}</small>
                )}
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
                      className={validationErrors.shop ? 'error' : ''}
                    />
                  ) : (
                    <select
                      name="shop"
                      value={formData.shop}
                      onChange={handleInputChange}
                      required
                      className={validationErrors.shop ? 'error' : ''}
                    >
                      <option value="">Select a shop</option>
                      {shops.map(shop => (
                        <option key={shop._id} value={shop._id}>{shop.name}</option>
                      ))}
                    </select>
                  )}
                  {validationErrors.shop && (
                    <small className="form-error">{validationErrors.shop}</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  {isShopAdmin ? (
                    <input
                      type="text"
                      value={formData.category ? (categories.find(c => c._id === formData.category)?.name || 'Loading...') : 'Please select a shop'}
                      readOnly
                      disabled
                      style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                      className={validationErrors.category ? 'error' : ''}
                    />
                  ) : (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className={validationErrors.category ? 'error' : ''}
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                  {validationErrors.category && (
                    <small className="form-error">{validationErrors.category}</small>
                  )}
                </div>
              </div>

              {availableProductTypes.length > 0 && (
                <div className="form-group">
                  <label>Product Type (Select Multiple)</label>
                  <div className="checkbox-group">
                    {availableProductTypes.map((type, index) => (
                      <label key={index} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.productType?.includes(type) || false}
                          onChange={() => handleProductTypeChange(type)}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
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

              {(isSuperAdmin || isMallAdmin || isShopAdmin) && (
                <div className="form-group">
                  <label>Rating (Optional)</label>
                  <input
                    type="number"
                    name="averageRating"
                    value={formData.averageRating}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty, or validate range 0-5
                      if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 5)) {
                        handleInputChange(e);
                      }
                    }}
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="0.0 - 5.0"
                  />
                  <small className="form-hint">Enter a rating between 0.0 and 5.0 (leave empty for default: 2.5 if no reviews exist)</small>
                </div>
              )}

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
                  <div className={`image-upload ${validationErrors.image ? 'error-border' : ''}`}>
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
                {validationErrors.image && (
                  <small className="form-error">{validationErrors.image}</small>
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
