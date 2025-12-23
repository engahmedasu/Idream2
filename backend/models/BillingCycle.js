const mongoose = require('mongoose');

const billingCycleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['monthly', 'yearly'],
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  durationInDays: {
    type: Number,
    required: true,
    min: 1
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

billingCycleSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model('BillingCycle', billingCycleSchema);

