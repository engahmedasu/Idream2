import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUser, FiPhone, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Users.css';

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // All hooks must be declared first
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    role: '',
    shop: '',
    isActive: true,
    isEmailVerified: false
  });

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  });

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus !== '') params.isActive = filterStatus === 'active';

      const [usersRes, rolesRes, shopsRes] = await Promise.all([
        api.get('/users', { params }),
        api.get('/roles'),
        api.get('/shops?isActive=true')
      ]);
      
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setShops(shopsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingUser) {
      setFormData({
        email: '',
        phone: '',
        password: '',
        role: '',
        shop: '',
        isActive: true,
        isEmailVerified: false
      });
      setValidationErrors({
        email: '',
        password: ''
      });
    }
  }, [showModal, editingUser]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    if (!password) return { valid: false, message: 'Password is required' };
    
    const errors = [];
    
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('a number');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('a special character');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('a lowercase letter');
    }
    
    if (errors.length > 0) {
      return {
        valid: false,
        message: `Password must contain: ${errors.join(', ')}`
      };
    }
    
    return { valid: true, message: '' };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    };
    
    // If role is changed to guest or shopAdmin, set isActive to false by default (for new users only)
    if (name === 'role' && !editingUser) {
      const selectedRole = roles.find(r => r._id === value);
      if (selectedRole && (selectedRole.name === 'guest' || selectedRole.name === 'shopAdmin')) {
        updatedFormData.isActive = false;
      } else if (selectedRole && (selectedRole.name === 'superAdmin' || selectedRole.name === 'mallAdmin')) {
        // SuperAdmin and MallAdmin should be active by default
        updatedFormData.isActive = true;
      }
    }
    
    setFormData(updatedFormData);

    // Validate email
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    }

    // Validate password
    if (name === 'password') {
      if (!editingUser || value) { // Only validate if creating or if editing and password is provided
        const passwordValidation = validatePassword(value);
        setValidationErrors(prev => ({
          ...prev,
          password: passwordValidation.message
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          password: ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setValidationErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password
    if (!editingUser) {
      // For new users, password is required
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        setValidationErrors(prev => ({
          ...prev,
          password: passwordValidation.message
        }));
        toast.error(passwordValidation.message);
        return;
      }
    } else if (formData.password) {
      // For editing, validate password only if provided
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        setValidationErrors(prev => ({
          ...prev,
          password: passwordValidation.message
        }));
        toast.error(passwordValidation.message);
        return;
      }
    }

    try {
      const submitData = { ...formData };
      
      // Don't send password if editing and password is empty
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      // Set shop to null if empty (to remove shop assignment)
      if (!submitData.shop) {
        submitData.shop = null;
      }

      // For new users, if role is guest or shopAdmin, ensure isActive is false
      if (!editingUser) {
        const selectedRole = roles.find(r => r._id === submitData.role);
        if (selectedRole && (selectedRole.name === 'guest' || selectedRole.name === 'shopAdmin')) {
          submitData.isActive = false;
        }
      }

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, submitData);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', submitData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      phone: user.phone,
      password: '', // Don't pre-fill password
      role: user.role?._id || user.role || '',
      shop: user.shop?._id || user.shop || '',
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      phone: '',
      password: '',
      role: '',
      shop: '',
      isActive: false, // Default to false, will be set based on role selection
      isEmailVerified: false
    });
    setValidationErrors({
      email: '',
      password: ''
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    // Explicitly reset all form data
    setFormData({
      email: '',
      phone: '',
      password: '',
      role: '',
      shop: '',
      isActive: true,
      isEmailVerified: false
    });
    setValidationErrors({
      email: '',
      password: ''
    });
    setEditingUser(null);
    setShowModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Don't render if user is not superAdmin (after all hooks)
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

  if (loading) {
    return <div className="users-page loading">Loading users...</div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Users Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create User
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role._id} value={role._id}>{role.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(filterRole || filterStatus) && (
            <button className="btn-clear" onClick={() => { setFilterRole(''); setFilterStatus(''); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Shop</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No users found</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        <FiUser />
                      </div>
                      <div>
                        <div className="user-email">{user.email}</div>
                        {user.createdAt && (
                          <div className="user-date">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      {user.phone && (
                        <div className="contact-item">
                          <FiPhone /> {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge role">
                      {user.role?.name || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {user.shop ? (
                      <span className="shop-name">{user.shop?.name || 'N/A'}</span>
                    ) : (
                      <span className="no-shop">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.isEmailVerified ? (
                      <span className="verified">
                        <FiCheckCircle /> Verified
                      </span>
                    ) : (
                      <span className="not-verified">
                        <FiXCircle /> Not Verified
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(user)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggle(user._id)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? '✓' : '✗'}
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(user._id)}
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
        <div className="modal-overlay" onClick={() => { 
          setShowModal(false); 
          resetForm(); 
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? 'Edit User' : 'Create User'}</h3>
            <form key={editingUser ? `edit-${editingUser._id}` : 'create'} onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingUser}
                  placeholder=""
                  className={validationErrors.email ? 'error' : ''}
                />
                {validationErrors.email && (
                  <small className="form-error">{validationErrors.email}</small>
                )}
                {editingUser && !validationErrors.email && (
                  <small className="form-hint">Email cannot be changed</small>
                )}
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {!editingUser && '*'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  required={!editingUser}
                  placeholder=""
                  className={validationErrors.password ? 'error' : ''}
                />
                {validationErrors.password && (
                  <small className="form-error">{validationErrors.password}</small>
                )}
                {!editingUser && !validationErrors.password && (
                  <small className="form-hint">
                    Password must be at least 8 characters and include: uppercase, lowercase, number, and special character
                  </small>
                )}
                {editingUser && !validationErrors.password && (
                  <small className="form-hint">Leave empty to keep current password</small>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role._id} value={role._id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Shop (Optional)</label>
                  <select
                    name="shop"
                    value={formData.shop}
                    onChange={handleInputChange}
                  >
                    <option value="">No Shop</option>
                    {shops.map(shop => (
                      <option key={shop._id} value={shop._id}>{shop.name}</option>
                    ))}
                  </select>
                </div>
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
                <label>
                  <input
                    type="checkbox"
                    name="isEmailVerified"
                    checked={formData.isEmailVerified}
                    onChange={handleInputChange}
                  />
                  Email Verified
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { 
                  setShowModal(false); 
                  resetForm(); 
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
