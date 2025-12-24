import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiArrowUp, FiArrowDown, FiImage, FiX, FiVideo
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Videos.css';

const Videos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    priority: 0,
    isActive: true
  });

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');

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

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== '') params.isActive = filterStatus === 'active';

      const response = await api.get('/videos', { params });
      setVideos(response.data);
    } catch (error) {
      toast.error('Failed to fetch videos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Reset form when opening create modal
  useEffect(() => {
    if (showModal && !editingVideo) {
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        priority: videos.length,
        isActive: true
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoPreview('');
      setThumbnailPreview('');
    }
  }, [showModal, editingVideo, videos.length]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB
        toast.error('Video file size must be less than 100MB');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setFormData(prev => ({ ...prev, videoUrl: '' }));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setFormData(prev => ({ ...prev, thumbnailUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description || '');
      submitData.append('priority', formData.priority);
      submitData.append('isActive', formData.isActive);

      // If no video file but videoUrl is provided, use videoUrl
      if (videoFile) {
        submitData.append('video', videoFile);
      } else if (formData.videoUrl) {
        submitData.append('videoUrl', formData.videoUrl);
      } else {
        toast.error('Please provide either a video file or video URL');
        return;
      }

      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      } else if (formData.thumbnailUrl) {
        submitData.append('thumbnailUrl', formData.thumbnailUrl);
      }

      if (editingVideo) {
        await api.put(`/videos/${editingVideo._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Video updated successfully');
      } else {
        await api.post('/videos', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Video created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchVideos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save video');
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      priority: video.priority || 0,
      isActive: video.isActive
    });
    setVideoPreview(video.videoUrl ? `http://localhost:5000${video.videoUrl}` : '');
    setThumbnailPreview(video.thumbnailUrl ? `http://localhost:5000${video.thumbnailUrl}` : '');
    setVideoFile(null);
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/videos/${id}`);
      toast.success('Video deleted successfully');
      fetchVideos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete video');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/videos/${id}/toggle`);
      toast.success('Video status updated');
      fetchVideos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update video');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;

    const updatedVideos = [...videos];
    const temp = updatedVideos[index].priority;
    updatedVideos[index].priority = updatedVideos[index - 1].priority;
    updatedVideos[index - 1].priority = temp;

    await updatePriority(updatedVideos);
  };

  const handleMoveDown = async (index) => {
    if (index === videos.length - 1) return;

    const updatedVideos = [...videos];
    const temp = updatedVideos[index].priority;
    updatedVideos[index].priority = updatedVideos[index + 1].priority;
    updatedVideos[index + 1].priority = temp;

    await updatePriority(updatedVideos);
  };

  const updatePriority = async (updatedVideos) => {
    try {
      const priorityData = updatedVideos.map((video) => ({
        id: video._id,
        priority: video.priority
      }));

      await api.patch('/videos/priority/update', { videos: priorityData });
      toast.success('Video priority updated');
      fetchVideos();
    } catch (error) {
      toast.error('Failed to update video priority');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      priority: 0,
      isActive: true
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview('');
    setThumbnailPreview('');
    setEditingVideo(null);
  };

  const openCreateModal = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      priority: videos.length
    }));
    setShowModal(true);
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchTerm || 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (loading) {
    return <div className="videos-page loading">Loading videos...</div>;
  }

  return (
    <div className="videos-page">
      <div className="page-header">
        <h2>Videos Management</h2>
        <button className="btn-primary" onClick={openCreateModal}>
          <FiPlus /> Create Video
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search videos..."
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
        <table className="videos-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Priority</th>
              <th>Title</th>
              <th>Description</th>
              <th>Thumbnail</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No videos found</td>
              </tr>
            ) : (
              filteredVideos.map((video, index) => (
                <tr key={video._id}>
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
                      <span className="order-number">{video.priority}</span>
                      <button
                        className="btn-order"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredVideos.length - 1}
                        title="Move down"
                      >
                        <FiArrowDown />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="video-title">{video.title}</div>
                  </td>
                  <td>
                    <div className="video-description">
                      {video.description || '-'}
                    </div>
                  </td>
                  <td>
                    {video.thumbnailUrl ? (
                      <img
                        src={`http://localhost:5000${video.thumbnailUrl}`}
                        alt={video.title}
                        className="video-thumbnail"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="no-thumbnail">No thumbnail</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${video.isActive ? 'active' : 'inactive'}`}>
                      {video.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(video)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleToggle(video._id)}
                        title={video.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {video.isActive ? '✓' : '✗'}
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(video._id)}
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
            <h3>{editingVideo ? 'Edit Video' : 'Create Video'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  required
                  placeholder="Video title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Video description"
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority || 0}
                  onChange={handleInputChange}
                  min="0"
                />
                <small className="form-hint">Higher numbers appear first in the frontend</small>
              </div>
              <div className="form-group">
                <label>Video File or URL *</label>
                {videoPreview && (
                  <div className="video-preview">
                    <video controls style={{ maxWidth: '100%', maxHeight: '300px' }}>
                      <source src={videoPreview} />
                    </video>
                    <button type="button" className="btn-remove-video" onClick={removeVideo}>
                      <FiX /> Remove
                    </button>
                  </div>
                )}
                {!videoPreview && (
                  <div className="video-upload">
                    <label className="upload-label">
                      <FiVideo />
                      <span>Choose Video File</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
                {!videoPreview && (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="url"
                      name="videoUrl"
                      value={formData.videoUrl || ''}
                      onChange={handleInputChange}
                      placeholder="Or enter video URL (e.g., YouTube, Vimeo embed URL)"
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Thumbnail Image</label>
                {thumbnailPreview && (
                  <div className="image-preview">
                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                    <button type="button" className="btn-remove-image" onClick={removeThumbnail}>
                      <FiX /> Remove
                    </button>
                  </div>
                )}
                {!thumbnailPreview && (
                  <div className="image-upload">
                    <label className="upload-label">
                      <FiImage />
                      <span>Choose Thumbnail</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
                {!thumbnailPreview && (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="url"
                      name="thumbnailUrl"
                      value={formData.thumbnailUrl || ''}
                      onChange={handleInputChange}
                      placeholder="Or enter thumbnail image URL"
                    />
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
                  {editingVideo ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;

