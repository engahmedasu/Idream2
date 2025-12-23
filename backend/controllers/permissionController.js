const Permission = require('../models/Permission');

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const { resource, action } = req.query;
    const filter = {};

    if (resource) filter.resource = resource;
    if (action) filter.action = action;

    const permissions = await Permission.find(filter)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ resource: 1, action: 1 });

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get permission by ID
exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.json(permission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create permission
exports.createPermission = async (req, res) => {
  try {
    const permissionData = {
      ...req.body,
      createdBy: req.user._id
    };

    const permission = await Permission.create(permissionData);
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update permission
exports.updatePermission = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.json(permission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete permission
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle permission active status
exports.togglePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    permission.isActive = !permission.isActive;
    permission.updatedBy = req.user._id;
    await permission.save();

    res.json(permission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

