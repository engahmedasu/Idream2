const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true
  },
  whatsapp: {
    type: String,
    required: true
  },
  instagram: {
    type: String,
    default: ''
  },
  facebook: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  productTypes: {
    type: [String],
    default: []
  },
  shareLink: {
    type: String,
    unique: true,
    default: function() {
      return `shop-${this._id}`;
    }
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

// Generate share link before save
shopSchema.pre('save', async function() {
  if (!this.shareLink) {
    this.shareLink = `shop-${this._id}`;
  }
});

// Index for sorting by priority
shopSchema.index({ priority: -1, createdAt: -1 });

module.exports = mongoose.model('Shop', shopSchema);

