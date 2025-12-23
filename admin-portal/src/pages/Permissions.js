import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Permissions.css';

const Permissions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // All hooks must be declared first
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const resources = ['user', 'role', 'permission', 'category', 'shop', 'product', 'cart', 'review', 'report'];
  const actions = ['create', 'read', 'update', 'delete', 'activate', 'deactivate', 'export'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
    isActive: true
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

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterResource) params.resource = filterResource;
      if (filterAction) params.action = filterAction;

      const response = await api.get('/permissions', { params });
      setPermissions(response.data);
    } catch (error) {
      toast.error('Failed to fetch permissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterResource, filterAction]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPermission) {
        await api.put(`/permissions/${editingPermission._id}`, formData);
        toast.success('Permission updated successfully');
      } else {
        await api.post('/permissions', formData);
        toast.success('Permission created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchPermissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save permission');
    }
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || '',
      resource: permission.resource,
      action: permission.action,
      isActive: permission.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      await api.delete(`/permissions/${id}`);
      toast.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete permission');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/permissions/${id}/toggle`);
      toast.success('Permission status updated');
      fetchPermissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update permission');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      resource: '',
      action: '',
      isActive: true
    });
    setEditingPermission(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = !searchTerm || 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div className="permissions-page loading">Loading permissions...</div>;
  }

  return (
    <div className="permissions-page">
      <div className="page-header">
        <h2>Permissions Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Permission
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FiFilter />
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)}>
            <option value="">All Resources</option>
            {resources.map(resource => (
              <option key={resource} value={resource}>{resource}</option>
            ))}
          </select>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          {(filterResource || filterAction) && (
            <button className="btn-clear" onClick={() => { setFilterResource(''); setFilterAction(''); fetchPermissions(); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Resource</th>
              <th>Action</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No permissions found</td>
              </tr>
            ) : (
              filteredPermissions.map(permission => (
                <tr key={permission._id}>
                  <td>{permission.name}</td>
                  <td>{permission.description || '-'}</td>
                  <td><span className="badge resource">{permission.resource}</span></td>
                  <td><span className="badge action">{permission.action}</span></td>
                  <td>
                    <span className={`status ${permission.isActive ? 'active' : 'inactive'}`}>
                      {permission.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(permission)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggle(permission._id)}
                        title={permission.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {permission.isActive ? '✓' : '✗'}
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(permission._id)}
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
            <h3>{editingPermission ? 'Edit Permission' : 'Create Permission'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., user.create"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Permission description"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Resource *</label>
                  <select
                    name="resource"
                    value={formData.resource}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Resource</option>
                    {resources.map(resource => (
                      <option key={resource} value={resource}>{resource}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Action *</label>
                  <select
                    name="action"
                    value={formData.action}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Action</option>
                    {actions.map(action => (
                      <option key={action} value={action}>{action}</option>
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
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPermission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permissions;
