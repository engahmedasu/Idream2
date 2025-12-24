const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Role = require('../../models/Role');
const Permission = require('../../models/Permission');
const Shop = require('../../models/Shop');
const Category = require('../../models/Category');

/**
 * Create a test user with a role and permissions
 */
const createTestUser = async (userData = {}) => {
  const roleData = userData.role || { name: 'testRole', description: 'Test Role' };
  const role = await Role.create(roleData);
  
  const defaultUser = {
    email: `test${Date.now()}@test.com`,
    password: 'password123',
    phone: '1234567890',
    role: role._id,
    isActive: true,
    isEmailVerified: true,
    ...userData
  };

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
 * Create test permissions
 */
const createTestPermissions = async (permissionNames = []) => {
  const permissions = [];
  for (const permName of permissionNames) {
    const [resource, action] = permName.split('.');
    const perm = await Permission.create({
      name: permName,
      resource,
      action,
      isActive: true
    });
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

  const superAdminRole = await Role.create({
    name: 'superAdmin',
    description: 'Super Administrator',
    permissions: allPermissions.map(p => p._id),
    isActive: true
  });

  const superAdmin = await User.create({
    email: 'superadmin@test.com',
    password: 'password123',
    phone: '1234567890',
    role: superAdminRole._id,
    isActive: true,
    isEmailVerified: true
  });

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

