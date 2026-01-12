import React, { useState, useEffect, useCallback } from 'react';
import { FiMail, FiSearch, FiEye, FiTrash2, FiX, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './ContactRequests.css';

const ContactRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0
  });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (readFilter !== 'all') {
        params.isRead = readFilter === 'read';
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/contact', { params });
      setRequests(response.data.requests);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      toast.error('Failed to fetch contact requests');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, readFilter, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/contact/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  const handleView = async (id) => {
    try {
      const response = await api.get(`/contact/${id}`);
      setSelectedRequest(response.data);
      setIsModalOpen(true);

      // Mark as read if not already read
      if (!response.data.isRead) {
        await api.patch(`/contact/${id}/read`);
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Error fetching contact request:', error);
      toast.error('Failed to fetch contact request');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/contact/${id}/status`, { status });
      toast.success('Status updated successfully');
      fetchRequests();
      fetchStats();
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest({ ...selectedRequest, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact request?')) {
      return;
    }

    try {
      await api.delete(`/contact/${id}`);
      toast.success('Contact request deleted successfully');
      fetchRequests();
      fetchStats();
      if (selectedRequest && selectedRequest._id === id) {
        setIsModalOpen(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error deleting contact request:', error);
      toast.error('Failed to delete contact request');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      new: { class: 'status-new', label: 'New' },
      read: { class: 'status-read', label: 'Read' },
      replied: { class: 'status-replied', label: 'Replied' },
      archived: { class: 'status-archived', label: 'Archived' }
    };
    return badges[status] || badges.new;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="contact-requests-page">
      <div className="contact-requests-header">
        <div className="contact-requests-title-section">
          <FiMail className="contact-requests-icon" />
          <h1>Contact Requests</h1>
        </div>
        <div className="contact-requests-stats">
          <div className="stat-card">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card new">
            <span className="stat-label">New</span>
            <span className="stat-value">{stats.new}</span>
          </div>
          <div className="stat-card read">
            <span className="stat-label">Read</span>
            <span className="stat-value">{stats.read}</span>
          </div>
          <div className="stat-card replied">
            <span className="stat-label">Replied</span>
            <span className="stat-value">{stats.replied}</span>
          </div>
        </div>
      </div>

      <div className="contact-requests-filters">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email, service, or message..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          />
        </div>
        <div className="filter-group">
          <FiFilter />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="filter-group">
          <select
            value={readFilter}
            onChange={(e) => {
              setReadFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
          >
            <option value="all">All</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <FiMail />
          <p>No contact requests found</p>
        </div>
      ) : (
        <>
          <div className="contact-requests-table-container">
            <table className="contact-requests-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const statusBadge = getStatusBadge(request.status);
                  return (
                    <tr
                      key={request._id}
                      className={!request.isRead ? 'unread' : ''}
                    >
                      <td>
                        <div className="name-cell">
                          {request.name}
                          {!request.isRead && <span className="unread-dot"></span>}
                        </div>
                      </td>
                      <td>{request.email}</td>
                      <td>{request.service}</td>
                      <td>
                        <span className={`status-badge ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => handleView(request._id)}
                            title="View"
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(request._id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {isModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Request Details</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Name:</label>
                <span>{selectedRequest.name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <a href={`mailto:${selectedRequest.email}`}>{selectedRequest.email}</a>
              </div>
              <div className="detail-row">
                <label>Service:</label>
                <span>{selectedRequest.service}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status-badge ${getStatusBadge(selectedRequest.status).class}`}>
                  {getStatusBadge(selectedRequest.status).label}
                </span>
              </div>
              <div className="detail-row">
                <label>Message:</label>
                <div className="message-content">{selectedRequest.message}</div>
              </div>
              <div className="detail-row">
                <label>Submitted:</label>
                <span>{formatDate(selectedRequest.createdAt)}</span>
              </div>
              {selectedRequest.readAt && (
                <div className="detail-row">
                  <label>Read:</label>
                  <span>{formatDate(selectedRequest.readAt)}</span>
                </div>
              )}
              {selectedRequest.repliedAt && (
                <div className="detail-row">
                  <label>Replied:</label>
                  <span>{formatDate(selectedRequest.repliedAt)}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="status-actions">
                <button
                  className="btn-status new"
                  onClick={() => handleStatusChange(selectedRequest._id, 'new')}
                  disabled={selectedRequest.status === 'new'}
                >
                  Mark as New
                </button>
                <button
                  className="btn-status read"
                  onClick={() => handleStatusChange(selectedRequest._id, 'read')}
                  disabled={selectedRequest.status === 'read'}
                >
                  Mark as Read
                </button>
                <button
                  className="btn-status replied"
                  onClick={() => handleStatusChange(selectedRequest._id, 'replied')}
                  disabled={selectedRequest.status === 'replied'}
                >
                  Mark as Replied
                </button>
                <button
                  className="btn-status archived"
                  onClick={() => handleStatusChange(selectedRequest._id, 'archived')}
                  disabled={selectedRequest.status === 'archived'}
                >
                  Archive
                </button>
              </div>
              <button
                className="btn-delete"
                onClick={() => handleDelete(selectedRequest._id)}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactRequests;

