import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Roles.css';

const Roles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // All hooks must be declared first
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
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

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/permissions')
      ]);
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data.filter(p => p.isActive));
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      const isSelected = currentPermissions.includes(permissionId);
      
      return {
        ...prev,
        permissions: isSelected
          ? currentPermissions.filter(id => id !== permissionId)
          : [...currentPermissions, permissionId]
      };
    });
  };

  const handleSelectAll = () => {
    const allPermissionIds = permissions.map(p => p._id);
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.length === permissions.length ? [] : allPermissionIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, formData);
        toast.success('Role updated successfully');
      } else {
        await api.post('/roles', formData);
        toast.success('Role created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map(p => p._id || p) || [],
      isActive: role.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/roles/${id}`);
      toast.success('Role deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/roles/${id}/toggle`);
      toast.success('Role status updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true
    });
    setEditingRole(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const resource = permission.resource;
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {});

  if (loading) {
    return <div className="roles-page loading">Loading roles...</div>;
  }

  return (
    <div className="roles-page">
      <div className="page-header">
        <h2>Roles Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Role
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="roles-grid">
        {filteredRoles.length === 0 ? (
          <div className="no-data">No roles found</div>
        ) : (
          filteredRoles.map(role => (
            <div key={role._id} className="role-card">
              <div className="role-card-header">
                <div className="role-icon">
                  <FiShield />
                </div>
                <div className="role-info">
                  <h3>{role.name}</h3>
                  <span className={`status ${role.isActive ? 'active' : 'inactive'}`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p className="role-description">{role.description || 'No description'}</p>
              <div className="role-permissions-count">
                <strong>{role.permissions?.length || 0}</strong> permissions assigned
              </div>
              {role.permissions && role.permissions.length > 0 && (
                <div className="role-permissions-preview">
                  {role.permissions.slice(0, 3).map(perm => (
                    <span key={perm._id || perm} className="permission-tag">
                      {typeof perm === 'string' ? perm : perm.name}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="permission-tag more">+{role.permissions.length - 3} more</span>
                  )}
                </div>
              )}
              <div className="role-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleEdit(role)}
                  title="Edit"
                >
                  <FiEdit />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleToggle(role._id)}
                  title={role.isActive ? 'Deactivate' : 'Activate'}
                >
                  {role.isActive ? '✓' : '✗'}
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(role._id)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRole ? 'Edit Role' : 'Create Role'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Sales, ContentManager, Moderator"
                />
                <small className="form-hint">Enter any role name. Use camelCase or PascalCase for consistency.</small>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Role description"
                />
              </div>
              
              <div className="permissions-section">
                <div className="permissions-header">
                  <label>Permissions *</label>
                  <button
                    type="button"
                    className="btn-select-all"
                    onClick={handleSelectAll}
                  >
                    {formData.permissions.length === permissions.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="permissions-container">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="permission-group">
                      <h4 className="resource-name">{resource}</h4>
                      <div className="permissions-list">
                        {perms.map(permission => {
                          const isSelected = formData.permissions.includes(permission._id);
                          return (
                            <label
                              key={permission._id}
                              className={`permission-item ${isSelected ? 'selected' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handlePermissionToggle(permission._id)}
                              />
                              <span className="permission-name">{permission.name}</span>
                              <span className="permission-action">{permission.action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="selected-count">
                  {formData.permissions.length} of {permissions.length} permissions selected
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
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
