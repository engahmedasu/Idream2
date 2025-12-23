const mongoose = require('mongoose');

const subscriptionPlanLimitSchema = new mongoose.Schema({
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  limitKey: {
    type: String,
    required: true,
    trim: true
  },
  limitValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
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

subscriptionPlanLimitSchema.index({ subscriptionPlan: 1, limitKey: 1 }, { unique: true });

module.exports = mongoose.model('SubscriptionPlanLimit', subscriptionPlanLimitSchema);

