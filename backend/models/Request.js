const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['join-our-team', 'new-ideas', 'hire-expert'],
    required: true
  },
  // Common fields
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Join Our Team specific fields
  positionOfInterest: {
    type: String,
    default: '',
    trim: true
  },
  coverLetter: {
    type: String,
    default: '',
    trim: true
  },
  // New Ideas specific fields
  ideaTitle: {
    type: String,
    default: '',
    trim: true
  },
  briefIdeaDescription: {
    type: String,
    default: '',
    trim: true
  },
  // Hire Expert specific fields
  companyName: {
    type: String,
    default: '',
    trim: true
  },
  serviceNeeded: {
    type: String,
    default: '',
    trim: true
  },
  projectDetails: {
    type: String,
    default: '',
    trim: true
  },
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  repliedAt: {
    type: Date,
    default: null
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  document: {
    type: String,
    default: ''
  },
  documentName: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
requestSchema.index({ type: 1, createdAt: -1 });
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ isRead: 1, createdAt: -1 });
requestSchema.index({ email: 1 });

module.exports = mongoose.model('Request', requestSchema);
