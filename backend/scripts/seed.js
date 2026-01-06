const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const Config = require('../models/Config');
const Category = require('../models/Category');
const BillingCycle = require('../models/BillingCycle');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionPlanFeature = require('../models/SubscriptionPlanFeature');
const SubscriptionPlanLimit = require('../models/SubscriptionPlanLimit');
const SubscriptionPricing = require('../models/SubscriptionPricing');

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
    },
    {
      name: 'sale',
      description: 'Sales team - can view shops, products, and sales reports',
      permissions: permissions
        .filter(p => 
          (p.resource === 'shop' && ['read', 'export'].includes(p.action)) ||
          (p.resource === 'product' && ['read', 'export'].includes(p.action)) ||
          (p.resource === 'report' && p.action === 'read') ||
          (p.resource === 'category' && p.action === 'read')
        )
        .map(p => p._id),
      isActive: true
    },
    {
      name: 'finance',
      description: 'Finance team - can view financial reports and user/shop financial data',
      permissions: permissions
        .filter(p => 
          (p.resource === 'report' && p.action === 'read') ||
          (p.resource === 'user' && p.action === 'read') ||
          (p.resource === 'shop' && ['read', 'export'].includes(p.action)) ||
          (p.resource === 'product' && ['read', 'export'].includes(p.action)) ||
          (p.resource === 'category' && p.action === 'read')
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
    email: 'superadmin@idreamegypt.com',
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
  console.log('  Email: superadmin@idreamegypt.com');
  console.log('  Password: P@ssw0rd123');
};

const seedMallAdmin = async (roles) => {
  const mallAdminRole = roles.find(r => r.name === 'mallAdmin');
  
  if (!mallAdminRole) {
    console.error('MallAdmin role not found');
    return;
  }

  const mallAdminData = {
    email: 'malladmin@idreamegypt.com',
    password: 'Mall@dmin123',
    phone: '+1234567891',
    role: mallAdminRole._id,
    isActive: true,
    isEmailVerified: true
  };

  const existingMallAdmin = await User.findOne({ email: mallAdminData.email });
  
  if (existingMallAdmin) {
    existingMallAdmin.password = mallAdminData.password;
    existingMallAdmin.role = mallAdminData.role;
    existingMallAdmin.isActive = true;
    existingMallAdmin.isEmailVerified = true;
    await existingMallAdmin.save();
    console.log('MallAdmin user updated');
  } else {
    await User.create(mallAdminData);
    console.log('MallAdmin user created');
  }

  console.log('MallAdmin credentials:');
  console.log('  Email: malladmin@idreamegypt.com');
  console.log('  Password: Mall@dmin123');
};

const seedBillingCycles = async () => {
  const cycles = [
    {
      name: 'monthly',
      displayName: 'Monthly',
      durationInDays: 30,
      isActive: true
    },
    {
      name: 'yearly',
      displayName: 'Yearly',
      durationInDays: 365,
      isActive: true
    }
  ];

  const createdCycles = [];
  for (const cycleData of cycles) {
    const cycle = await BillingCycle.findOneAndUpdate(
      { name: cycleData.name },
      cycleData,
      { upsert: true, new: true }
    );
    createdCycles.push(cycle);
  }

  console.log('Billing cycles seeded');
  return createdCycles;
};

const seedCategories = async (superAdmin) => {
  const categories = [
    {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      icon: 'FiSmartphone',
      isActive: true,
      order: 1,
      createdBy: superAdmin._id
    },
    {
      name: 'Fashion',
      description: 'Clothing and accessories',
      icon: 'FiShoppingBag',
      isActive: true,
      order: 2,
      createdBy: superAdmin._id
    },
    {
      name: 'Home & Living',
      description: 'Home decor and furniture',
      icon: 'FiHome',
      isActive: true,
      order: 3,
      createdBy: superAdmin._id
    },
    {
      name: 'Beauty & Personal Care',
      description: 'Beauty products and personal care items',
      icon: 'FiHeart',
      isActive: true,
      order: 4,
      createdBy: superAdmin._id
    },
    {
      name: 'Sports & Outdoors',
      description: 'Sports equipment and outdoor gear',
      icon: 'FiActivity',
      isActive: true,
      order: 5,
      createdBy: superAdmin._id
    },
    {
      name: 'Books & Media',
      description: 'Books, movies, and media',
      icon: 'FiBook',
      isActive: true,
      order: 6,
      createdBy: superAdmin._id
    },
    {
      name: 'Food & Beverages',
      description: 'Food items and beverages',
      icon: 'FiCoffee',
      isActive: true,
      order: 7,
      createdBy: superAdmin._id
    },
    {
      name: 'Toys & Games',
      description: 'Toys and games for all ages',
      icon: 'FiZap',
      isActive: true,
      order: 8,
      createdBy: superAdmin._id
    }
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const category = await Category.findOneAndUpdate(
      { name: categoryData.name },
      categoryData,
      { upsert: true, new: true }
    );
    createdCategories.push(category);
  }

  console.log('Categories seeded');
  return createdCategories;
};

const seedSubscriptionPlans = async (billingCycles, superAdmin) => {
  const monthlyCycle = billingCycles.find(c => c.name === 'monthly');
  const yearlyCycle = billingCycles.find(c => c.name === 'yearly');

  if (!monthlyCycle || !yearlyCycle) {
    console.error('Billing cycles not found');
    return;
  }

  // Free Plan
  const freePlan = await SubscriptionPlan.findOneAndUpdate(
    { displayName: 'Free' },
    {
      displayName: 'Free',
      description: 'Perfect for getting started',
      isActive: true,
      sortOrder: 1,
      createdBy: superAdmin._id
    },
    { upsert: true, new: true }
  );

  // Basic Plan
  const basicPlan = await SubscriptionPlan.findOneAndUpdate(
    { displayName: 'Basic' },
    {
      displayName: 'Basic',
      description: 'For small shops with moderate needs',
      isActive: true,
      sortOrder: 2,
      createdBy: superAdmin._id
    },
    { upsert: true, new: true }
  );

  // Premium Plan
  const premiumPlan = await SubscriptionPlan.findOneAndUpdate(
    { displayName: 'Premium' },
    {
      displayName: 'Premium',
      description: 'For growing businesses',
      isActive: true,
      sortOrder: 3,
      createdBy: superAdmin._id
    },
    { upsert: true, new: true }
  );

  // Enterprise Plan
  const enterprisePlan = await SubscriptionPlan.findOneAndUpdate(
    { displayName: 'Enterprise' },
    {
      displayName: 'Enterprise',
      description: 'For large businesses with high volume',
      isActive: true,
      sortOrder: 4,
      createdBy: superAdmin._id
    },
    { upsert: true, new: true }
  );

  const plans = [freePlan, basicPlan, premiumPlan, enterprisePlan];

  // Seed Features
  const planFeatures = {
    Free: [
      { title: 'Up to 10 products', isHighlighted: false, sortOrder: 1 },
      { title: 'Basic shop profile', isHighlighted: false, sortOrder: 2 },
      { title: 'Email support', isHighlighted: false, sortOrder: 3 }
    ],
    Basic: [
      { title: 'Up to 50 products', isHighlighted: true, sortOrder: 1 },
      { title: 'Enhanced shop profile', isHighlighted: false, sortOrder: 2 },
      { title: 'Up to 3 hot offers', isHighlighted: true, sortOrder: 3 },
      { title: 'Email support', isHighlighted: false, sortOrder: 4 },
      { title: 'Basic analytics', isHighlighted: false, sortOrder: 5 }
    ],
    Premium: [
      { title: 'Up to 200 products', isHighlighted: true, sortOrder: 1 },
      { title: 'Premium shop profile', isHighlighted: false, sortOrder: 2 },
      { title: 'Up to 10 hot offers', isHighlighted: true, sortOrder: 3 },
      { title: 'Priority support', isHighlighted: true, sortOrder: 4 },
      { title: 'Advanced analytics', isHighlighted: false, sortOrder: 5 },
      { title: 'Product priority listing', isHighlighted: false, sortOrder: 6 }
    ],
    Enterprise: [
      { title: 'Unlimited products', isHighlighted: true, sortOrder: 1 },
      { title: 'Custom shop profile', isHighlighted: false, sortOrder: 2 },
      { title: 'Unlimited hot offers', isHighlighted: true, sortOrder: 3 },
      { title: '24/7 dedicated support', isHighlighted: true, sortOrder: 4 },
      { title: 'Full analytics dashboard', isHighlighted: false, sortOrder: 5 },
      { title: 'Highest priority listing', isHighlighted: false, sortOrder: 6 },
      { title: 'Custom integrations', isHighlighted: false, sortOrder: 7 }
    ]
  };

  for (const plan of plans) {
    const features = planFeatures[plan.displayName] || [];
    // Clear existing features
    await SubscriptionPlanFeature.deleteMany({ subscriptionPlan: plan._id });
    
    for (const featureData of features) {
      await SubscriptionPlanFeature.create({
        ...featureData,
        subscriptionPlan: plan._id,
        createdBy: superAdmin._id
      });
    }
  }

  // Seed Limits
  const planLimits = {
    Free: [
      { limitKey: 'maxProducts', limitValue: 10 },
      { limitKey: 'maxHotOffers', limitValue: 0 }
    ],
    Basic: [
      { limitKey: 'maxProducts', limitValue: 50 },
      { limitKey: 'maxHotOffers', limitValue: 3 }
    ],
    Premium: [
      { limitKey: 'maxProducts', limitValue: 200 },
      { limitKey: 'maxHotOffers', limitValue: 10 }
    ],
    Enterprise: [
      { limitKey: 'maxProducts', limitValue: -1 }, // -1 means unlimited
      { limitKey: 'maxHotOffers', limitValue: -1 }
    ]
  };

  for (const plan of plans) {
    const limits = planLimits[plan.displayName] || [];
    // Clear existing limits
    await SubscriptionPlanLimit.deleteMany({ subscriptionPlan: plan._id });
    
    for (const limitData of limits) {
      await SubscriptionPlanLimit.create({
        ...limitData,
        subscriptionPlan: plan._id,
        createdBy: superAdmin._id
      });
    }
  }

  // Seed Pricing
  const planPricing = [
    { plan: freePlan, monthly: 0, yearly: 0 },
    { plan: basicPlan, monthly: 29.99, yearly: 299.99 },
    { plan: premiumPlan, monthly: 79.99, yearly: 799.99 },
    { plan: enterprisePlan, monthly: 199.99, yearly: 1999.99 }
  ];

  for (const pricing of planPricing) {
    // Monthly pricing
    await SubscriptionPricing.findOneAndUpdate(
      { subscriptionPlan: pricing.plan._id, billingCycle: monthlyCycle._id },
      {
        subscriptionPlan: pricing.plan._id,
        billingCycle: monthlyCycle._id,
        price: pricing.monthly,
        currency: 'USD',
        discount: 0,
        isActive: true,
        createdBy: superAdmin._id
      },
      { upsert: true, new: true }
    );

    // Yearly pricing (with 10% discount)
    const yearlyPrice = pricing.yearly;
    const monthlyEquivalent = pricing.monthly * 12;
    const discount = monthlyEquivalent > 0 ? Math.round(((monthlyEquivalent - yearlyPrice) / monthlyEquivalent) * 100) : 0;

    await SubscriptionPricing.findOneAndUpdate(
      { subscriptionPlan: pricing.plan._id, billingCycle: yearlyCycle._id },
      {
        subscriptionPlan: pricing.plan._id,
        billingCycle: yearlyCycle._id,
        price: yearlyPrice,
        currency: 'USD',
        discount: discount,
        isActive: true,
        createdBy: superAdmin._id
      },
      { upsert: true, new: true }
    );
  }

  console.log('Subscription plans seeded');
  return plans;
};

const seed = async () => {
  try {
    await connectDB();

    console.log('\n🚀 Starting database seeding...\n');

    // 1. Seed Permissions
    console.log('📋 Seeding permissions...');
    const permissions = await seedPermissions();

    // 2. Seed Roles
    console.log('👥 Seeding roles...');
    const roles = await seedRoles(permissions);

    // 3. Seed Config
    console.log('⚙️  Seeding configuration...');
    await seedConfig();

    // 4. Seed Users
    console.log('👤 Seeding users...');
    await seedSuperAdmin(roles);
    await seedMallAdmin(roles);
    const superAdmin = await User.findOne({ email: 'superadmin@idreamegypt.com' });

    // 5. Seed Billing Cycles
    console.log('📅 Seeding billing cycles...');
    const billingCycles = await seedBillingCycles();

    // 6. Seed Categories
    console.log('📦 Seeding categories...');
    const categories = await seedCategories(superAdmin);

    // 7. Seed Subscription Plans
    console.log('💳 Seeding subscription plans...');
    const subscriptionPlans = await seedSubscriptionPlans(billingCycles, superAdmin);

    console.log('\n✅ Database seeded successfully!\n');
    
    console.log('📊 Summary:');
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Billing Cycles: ${billingCycles.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Subscription Plans: ${subscriptionPlans.length}`);
    
    console.log('\n🔐 Admin Credentials:');
    console.log('   SuperAdmin:');
    console.log('     Email: superadmin@idreamegypt.com');
    console.log('     Password: P@ssw0rd123');
    console.log('   MallAdmin:');
    console.log('     Email: malladmin@idreamegypt.com');
    console.log('     Password: Mall@dmin123');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Login to admin portal with SuperAdmin credentials');
    console.log('   2. Review and customize subscription plans if needed');
    console.log('   3. Add more categories or modify existing ones');
    console.log('   4. Start creating shops and products\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

seed();

