const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');

// Get all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ name: 1 });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create role
exports.createRole = async (req, res) => {
  try {
    const roleData = {
      ...req.body,
      createdBy: req.user._id
    };

    const role = await Role.create(roleData);
    await role.populate('permissions');

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('permissions');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        message: `Cannot delete role. ${usersWithRole} user(s) are currently assigned to this role. Please reassign users to another role first.` 
      });
    }

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle role active status
exports.toggleRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    role.isActive = !role.isActive;
    role.updatedBy = req.user._id;
    await role.save();

    await role.populate('permissions');
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

