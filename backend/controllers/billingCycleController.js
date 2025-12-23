const BillingCycle = require('../models/BillingCycle');

// Get all billing cycles
exports.getAllBillingCycles = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const billingCycles = await BillingCycle.find(filter)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ name: 1 });

    res.json(billingCycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get billing cycle by ID
exports.getBillingCycleById = async (req, res) => {
  try {
    const billingCycle = await BillingCycle.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    res.json(billingCycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create billing cycle
exports.createBillingCycle = async (req, res) => {
  try {
    const billingCycleData = {
      ...req.body,
      createdBy: req.user._id
    };

    const billingCycle = await BillingCycle.create(billingCycleData);
    await billingCycle.populate('createdBy', 'email');
    await billingCycle.populate('updatedBy', 'email');

    res.status(201).json(billingCycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update billing cycle
exports.updateBillingCycle = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const billingCycle = await BillingCycle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    res.json(billingCycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete billing cycle
exports.deleteBillingCycle = async (req, res) => {
  try {
    const billingCycle = await BillingCycle.findByIdAndDelete(req.params.id);
    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    res.json({ message: 'Billing cycle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle billing cycle active status
exports.toggleBillingCycle = async (req, res) => {
  try {
    const billingCycle = await BillingCycle.findById(req.params.id);
    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    billingCycle.isActive = !billingCycle.isActive;
    billingCycle.updatedBy = req.user._id;
    await billingCycle.save();

    await billingCycle.populate('createdBy', 'email');
    await billingCycle.populate('updatedBy', 'email');

    res.json(billingCycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

