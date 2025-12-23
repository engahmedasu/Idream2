const mongoose = require('mongoose');

const shopSubscriptionSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    unique: true
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  billingCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingCycle',
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active'
  },
  scheduledDowngrade: {
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },
    billingCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingCycle',
      default: null
    },
    effectiveDate: {
      type: Date,
      default: null
    }
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

shopSubscriptionSchema.index({ shop: 1, status: 1 });
shopSubscriptionSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model('ShopSubscription', shopSubscriptionSchema);

