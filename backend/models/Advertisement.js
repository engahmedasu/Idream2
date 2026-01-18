const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  side: {
    type: String,
    enum: ['left', 'right'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showInHome: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  redirectUrl: {
    type: String,
    default: ''
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
advertisementSchema.index({ categories: 1, side: 1, isActive: 1 });
advertisementSchema.index({ side: 1, isActive: 1 });
advertisementSchema.index({ startDate: 1, endDate: 1 });
advertisementSchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
