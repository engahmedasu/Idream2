const User = require('../models/User');
const Role = require('../models/Role');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .populate('role', 'name')
      .populate('shop', 'name')
      .populate('allowedCategories', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role')
      .populate('shop')
      .populate('allowedCategories', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const userData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Get the role to check if it's guest or shopAdmin
    const Role = require('../models/Role');
    const role = await Role.findById(userData.role);
    
    // For guest and shopAdmin roles, set isActive to false by default (requires SuperAdmin activation)
    if (role && (role.name === 'guest' || role.name === 'shopAdmin')) {
      userData.isActive = false;
    }

    const user = await User.create(userData);
    await user.populate('role shop allowedCategories');

    res.status(201).json({
      ...user.toObject(),
      password: undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Handle password update - if provided, it will be hashed by pre-save hook
    if (updateData.password) {
      user.password = updateData.password; // Will be hashed by pre-save hook
    }

    // Handle shop field: convert empty string to null to remove shop assignment
    if (updateData.shop === '' || updateData.shop === null || updateData.shop === undefined) {
      updateData.shop = null;
    }

    // Handle allowedCategories field: ensure it's an array or empty array
    if (updateData.allowedCategories !== undefined) {
      if (!Array.isArray(updateData.allowedCategories)) {
        updateData.allowedCategories = updateData.allowedCategories ? [updateData.allowedCategories] : [];
      }
    }

    // Update other fields (excluding password which is handled above)
    const { password, ...otherFields } = updateData;
    Object.assign(user, otherFields);

    // Save user (this will trigger password hashing if password was modified)
    await user.save();

    await user.populate('role shop allowedCategories');
    
    res.json({
      ...user.toObject(),
      password: undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate/Deactivate user
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    user.updatedBy = req.user._id;
    await user.save();

    await user.populate('role shop allowedCategories');
    res.json({
      ...user.toObject(),
      password: undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

