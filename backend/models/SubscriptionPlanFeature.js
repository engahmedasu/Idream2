const mongoose = require('mongoose');

const subscriptionPlanFeatureSchema = new mongoose.Schema({
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  isHighlighted: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
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

subscriptionPlanFeatureSchema.index({ subscriptionPlan: 1, sortOrder: 1 });

module.exports = mongoose.model('SubscriptionPlanFeature', subscriptionPlanFeatureSchema);

