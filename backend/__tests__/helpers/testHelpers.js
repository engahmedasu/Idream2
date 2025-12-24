const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Role = require('../../models/Role');
const Permission = require('../../models/Permission');
const Shop = require('../../models/Shop');
const Category = require('../../models/Category');
const bcrypt = require('bcryptjs');

/**
 * Create a test user with a role and permissions
 */
const createTestUser = async (userData = {}) => {
  let role = userData.role;
  if (!role) {
    // No role provided, create a default test role
    role = await Role.create({
      name: `testRole${Date.now()}`,
      description: 'Test Role',
      isActive: true,
      permissions: []
    });
  } else if (typeof role === 'object') {
    // Role is an object
    if (role._id) {
      // Role already exists (has _id), use it as is
      role = role;
    } else {
      // Role object without _id, create it
      role = await Role.create({
        name: role.name || `testRole${Date.now()}`,
        description: role.description || 'Test Role',
        isActive: role.isActive !== undefined ? role.isActive : true,
        permissions: role.permissions || []
      });
    }
  } else if (typeof role === 'string') {
    // Role is a string (role name), find or create it
    role = await Role.findOne({ name: role }) || await Role.create({
      name: role,
      description: 'Test Role',
      isActive: true,
      permissions: []
    });
  }

  // Extract role from userData to avoid overwriting the role._id
  const { role: _, ...userDataWithoutRole } = userData;

  // Don't hash password here - let User model's pre-save hook handle it
  const defaultUser = {
    email: `test${Date.now()}@test.com`,
    password: userData.password || 'password123', // Will be hashed by User model
    phone: '1234567890',
    role: role._id, // Always use role._id, never the role object
    isActive: true,
    isEmailVerified: true,
    ...userDataWithoutRole // Spread userData without the role property
  };

  // If password is provided in userData, use it (but it will be hashed by pre-save hook)
  // Only set password if not already provided
  if (!defaultUser.password) {
    defaultUser.password = 'password123';
  }

  const user = await User.create(defaultUser);
  
  return { user, role };
};

/**
 * Create a test role with permissions
 */
const createTestRole = async (roleData = {}, permissions = []) => {
  const role = await Role.create({
    name: roleData.name || `testRole${Date.now()}`,
    description: roleData.description || 'Test Role',
    isActive: roleData.isActive !== undefined ? roleData.isActive : true,
    ...roleData
  });

  if (permissions.length > 0) {
    const permissionDocs = await Permission.insertMany(permissions);
    role.permissions = permissionDocs.map(p => p._id);
    await role.save();
    return { role, permissions: permissionDocs };
  }

  return { role, permissions: [] };
};

/**
 * Create test permissions (uses upsert to avoid duplicate key errors)
 */
const createTestPermissions = async (permissionNames = []) => {
  const permissions = [];
  for (const permName of permissionNames) {
    const [resource, action] = permName.split('.');
    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const perm = await Permission.findOneAndUpdate(
      { name: permName },
      {
        name: permName,
        resource,
        action,
        isActive: true
      },
      { upsert: true, new: true }
    );
    permissions.push(perm);
  }
  return permissions;
};

/**
 * Generate JWT token for a user
 */
const generateAuthToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'test-secret-key-for-jwt',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

/**
 * Create authenticated request headers
 */
const getAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Create a test shop
 */
const createTestShop = async (shopData = {}) => {
  let category = shopData.category;
  if (!category) {
    category = await Category.create({
      name: 'Test Category',
      icon: '/test-icon.png',
      isActive: true
    });
  }

  const defaultShop = {
    name: `Test Shop ${Date.now()}`,
    email: `shop${Date.now()}@test.com`,
    mobile: '1234567890',
    whatsapp: '1234567890', // Required field
    address: '123 Test Street',
    category: category._id,
    isActive: true,
    isApproved: true,
    ...shopData
  };

  return await Shop.create(defaultShop);
};

/**
 * Create a test category
 */
const createTestCategory = async (categoryData = {}) => {
  const defaultCategory = {
    name: `Test Category ${Date.now()}`,
    icon: '/test-icon.png',
    isActive: true,
    ...categoryData
  };

  return await Category.create(defaultCategory);
};

/**
 * Create superAdmin user for tests
 */
const createSuperAdmin = async () => {
  // Create all permissions
  const allPermissions = await createTestPermissions([
    'user.create', 'user.read', 'user.update', 'user.delete',
    'role.create', 'role.read', 'role.update', 'role.delete',
    'shop.create', 'shop.read', 'shop.update', 'shop.delete', 'shop.activate',
    'product.create', 'product.read', 'product.update', 'product.delete', 'product.activate',
    'category.create', 'category.read', 'category.update', 'category.delete',
    'report.read'
  ]);

  // Delete existing superAdmin role if it exists to ensure fresh start
  await Role.findOneAndDelete({ name: 'superAdmin' });
  
  // Create fresh role with all permissions
  const superAdminRole = await Role.create({
    name: 'superAdmin',
    description: 'Super Administrator',
    permissions: allPermissions.map(p => p._id),
    isActive: true
  });
  
  // Verify role was created with permissions
  if (!superAdminRole.permissions || superAdminRole.permissions.length === 0) {
    throw new Error('Failed to create superAdmin role with permissions');
  }

  // Find or create user - update existing to ensure role is correct
  let superAdmin = await User.findOne({ email: 'superadmin@test.com' });
  if (!superAdmin) {
    // Don't hash password - let User model handle it
    superAdmin = await User.create({
      email: 'superadmin@test.com',
      password: 'password123', // Will be hashed by User model pre-save hook
      phone: '1234567890',
      role: superAdminRole._id,
      isActive: true,
      isEmailVerified: true
    });
  } else {
    // Update existing user to ensure role and active status are correct
    // Use findByIdAndUpdate to avoid triggering password hash on save
    superAdmin = await User.findByIdAndUpdate(
      superAdmin._id,
      {
        role: superAdminRole._id,
        isActive: true,
        isEmailVerified: true
      },
      { new: true }
    );
  }

  return { user: superAdmin, role: superAdminRole, permissions: allPermissions };
};

module.exports = {
  createTestUser,
  createTestRole,
  createTestPermissions,
  generateAuthToken,
  getAuthHeaders,
  createTestShop,
  createTestCategory,
  createSuperAdmin
};

