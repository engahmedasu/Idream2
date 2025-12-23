const mongoose = require('mongoose');

const subscriptionLogSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopName: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'activated', 'cancelled', 'expired', 'renewed'],
    required: true
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  subscriptionPlanName: {
    type: String,
    default: ''
  },
  billingCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingCycle',
    required: true
  },
  billingCycleName: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    required: true
  },
  previousSubscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    default: null
  },
  previousSubscriptionPlanName: {
    type: String,
    default: ''
  },
  previousBillingCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingCycle',
    default: null
  },
  previousBillingCycleName: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdByEmail: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

subscriptionLogSchema.index({ shop: 1, createdAt: -1 });
subscriptionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SubscriptionLog', subscriptionLogSchema);

