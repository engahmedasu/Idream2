const mongoose = require('mongoose');

const subscriptionUsageSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  limitKey: {
    type: String,
    required: true,
    trim: true
  },
  currentUsage: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

subscriptionUsageSchema.index({ shop: 1, limitKey: 1 }, { unique: true });
subscriptionUsageSchema.index({ shop: 1 });

module.exports = mongoose.model('SubscriptionUsage', subscriptionUsageSchema);

