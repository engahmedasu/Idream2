const mongoose = require('mongoose');

const subscriptionPricingSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
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

subscriptionPricingSchema.index({ subscriptionPlan: 1, billingCycle: 1 }, { unique: true });
subscriptionPricingSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPricing', subscriptionPricingSchema);

