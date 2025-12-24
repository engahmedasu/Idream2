const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const Config = require('../models/Config');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idream');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedPermissions = async () => {
  const permissions = [
    // User permissions
    { name: 'user.create', description: 'Create users', resource: 'user', action: 'create' },
    { name: 'user.read', description: 'Read users', resource: 'user', action: 'read' },
    { name: 'user.update', description: 'Update users', resource: 'user', action: 'update' },
    { name: 'user.delete', description: 'Delete users', resource: 'user', action: 'delete' },
    { name: 'user.activate', description: 'Activate/deactivate users', resource: 'user', action: 'activate' },
    
    // Role permissions
    { name: 'role.create', description: 'Create roles', resource: 'role', action: 'create' },
    { name: 'role.read', description: 'Read roles', resource: 'role', action: 'read' },
    { name: 'role.update', description: 'Update roles', resource: 'role', action: 'update' },
    { name: 'role.delete', description: 'Delete roles', resource: 'role', action: 'delete' },
    { name: 'role.activate', description: 'Activate/deactivate roles', resource: 'role', action: 'activate' },
    
    // Permission permissions
    { name: 'permission.create', description: 'Create permissions', resource: 'permission', action: 'create' },
    { name: 'permission.read', description: 'Read permissions', resource: 'permission', action: 'read' },
    { name: 'permission.update', description: 'Update permissions', resource: 'permission', action: 'update' },
    { name: 'permission.delete', description: 'Delete permissions', resource: 'permission', action: 'delete' },
    { name: 'permission.activate', description: 'Activate/deactivate permissions', resource: 'permission', action: 'activate' },
    
    // Category permissions
    { name: 'category.create', description: 'Create categories', resource: 'category', action: 'create' },
    { name: 'category.read', description: 'Read categories', resource: 'category', action: 'read' },
    { name: 'category.update', description: 'Update categories', resource: 'category', action: 'update' },
    { name: 'category.delete', description: 'Delete categories', resource: 'category', action: 'delete' },
    { name: 'category.activate', description: 'Activate/deactivate categories', resource: 'category', action: 'activate' },
    
    // Shop permissions
    { name: 'shop.create', description: 'Create shops', resource: 'shop', action: 'create' },
    { name: 'shop.read', description: 'Read shops', resource: 'shop', action: 'read' },
    { name: 'shop.update', description: 'Update shops', resource: 'shop', action: 'update' },
    { name: 'shop.delete', description: 'Delete shops', resource: 'shop', action: 'delete' },
    { name: 'shop.activate', description: 'Activate/deactivate shops', resource: 'shop', action: 'activate' },
    { name: 'shop.export', description: 'Export shops', resource: 'shop', action: 'export' },
    
    // Product permissions
    { name: 'product.create', description: 'Create products', resource: 'product', action: 'create' },
    { name: 'product.read', description: 'Read products', resource: 'product', action: 'read' },
    { name: 'product.update', description: 'Update products', resource: 'product', action: 'update' },
    { name: 'product.delete', description: 'Delete products', resource: 'product', action: 'delete' },
    { name: 'product.activate', description: 'Activate/deactivate products', resource: 'product', action: 'activate' },
    { name: 'product.export', description: 'Export products', resource: 'product', action: 'export' },
    
    // Report permissions
    { name: 'report.read', description: 'Generate reports', resource: 'report', action: 'read' },
    
    // Video permissions
    { name: 'video.create', description: 'Create videos', resource: 'video', action: 'create' },
    { name: 'video.read', description: 'Read videos', resource: 'video', action: 'read' },
    { name: 'video.update', description: 'Update videos', resource: 'video', action: 'update' },
    { name: 'video.delete', description: 'Delete videos', resource: 'video', action: 'delete' },
    { name: 'video.activate', description: 'Activate/deactivate videos', resource: 'video', action: 'activate' },
  ];

  for (const perm of permissions) {
    await Permission.findOneAndUpdate(
      { name: perm.name },
      perm,
      { upsert: true, new: true }
    );
  }

  console.log('Permissions seeded');
  return await Permission.find();
};

const seedRoles = async (permissions) => {
  const allPerms = permissions.map(p => p._id);

  const roles = [
    {
      name: 'superAdmin',
      description: 'Super Administrator with all permissions',
      permissions: allPerms,
      isActive: true
    },
    {
      name: 'mallAdmin',
      description: 'Mall Administrator - can manage shops and products',
      permissions: permissions
        .filter(p => 
          p.resource === 'shop' || 
          p.resource === 'product' || 
          p.resource === 'report'
        )
        .map(p => p._id),
      isActive: true
    },
    {
      name: 'shopAdmin',
      description: 'Shop Administrator - can manage own products',
      permissions: permissions
        .filter(p => 
          (p.resource === 'product' && ['create', 'read', 'update', 'delete'].includes(p.action)) ||
          (p.resource === 'report' && p.action === 'read')
        )
        .map(p => p._id),
      isActive: true
    },
    {
      name: 'guest',
      description: 'Guest user - can browse and purchase',
      permissions: permissions
        .filter(p => 
          p.resource === 'product' && p.action === 'read' ||
          p.resource === 'shop' && p.action === 'read' ||
          p.resource === 'category' && p.action === 'read'
        )
        .map(p => p._id),
      isActive: true
    }
  ];

  for (const role of roles) {
    await Role.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true }
    );
  }

  console.log('Roles seeded');
  return await Role.find();
};

const seedConfig = async () => {
  const configs = [
    { key: 'maxHotOffersPerShop', value: 5, description: 'Maximum number of hot offers allowed per shop' }
  ];

  for (const config of configs) {
    await Config.findOneAndUpdate(
      { key: config.key },
      config,
      { upsert: true, new: true }
    );
  }

  console.log('Config seeded');
};

const seedSuperAdmin = async (roles) => {
  const superAdminRole = roles.find(r => r.name === 'superAdmin');
  
  if (!superAdminRole) {
    console.error('SuperAdmin role not found');
    return;
  }

  const superAdminData = {
    email: 'superadmin@idream.com',
    password: 'P@ssw0rd123',
    phone: '+1234567890', // Default phone number
    role: superAdminRole._id,
    isActive: true,
    isEmailVerified: true // Admin accounts don't need email verification
  };

  const existingSuperAdmin = await User.findOne({ email: superAdminData.email });
  
  if (existingSuperAdmin) {
    // Update existing super admin - password will be hashed by pre-save hook
    existingSuperAdmin.password = superAdminData.password;
    existingSuperAdmin.role = superAdminData.role;
    existingSuperAdmin.isActive = true;
    existingSuperAdmin.isEmailVerified = true;
    await existingSuperAdmin.save();
    console.log('SuperAdmin user updated');
  } else {
    // Create new super admin - password will be hashed by pre-save hook
    await User.create(superAdminData);
    console.log('SuperAdmin user created');
  }

  console.log('SuperAdmin credentials:');
  console.log('  Email: superadmin@idream.com');
  console.log('  Password: P@ssw0rd123');
};

const seed = async () => {
  try {
    await connectDB();

    console.log('Seeding database...');

    const permissions = await seedPermissions();
    const roles = await seedRoles(permissions);
    await seedConfig();
    await seedSuperAdmin(roles);

    console.log('\nDatabase seeded successfully!');
    console.log('\nRoles created:');
    roles.forEach(role => {
      console.log(`- ${role.name}: ${role.permissions.length} permissions`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();

