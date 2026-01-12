const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isHotOffer: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingTitle: {
    type: String,
    default: ''
  },
  shippingDescription: {
    type: String,
    default: ''
  },
  shippingFees: {
    type: Number,
    default: 0,
    min: 0
  },
  warrantyTitle: {
    type: String,
    default: ''
  },
  warrantyDescription: {
    type: String,
    default: ''
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  productType: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: false // Requires superadmin approval
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  imageQualityComment: {
    type: String,
    default: ''
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

// Index for sorting by priority
productSchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);

