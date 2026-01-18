const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');
const User = require('../models/User');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idream');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    await connectDB();

    console.log('\n🔍 Checking for superAdmin role...');
    
    // Find or create superAdmin role
    let superAdminRole = await Role.findOne({ name: 'superAdmin' });
    
    if (!superAdminRole) {
      console.log('⚠️  SuperAdmin role not found. Please run the seed script first:');
      console.log('   npm run seed');
      console.log('\n   Or creating a basic superAdmin role...');
      
      // Get all permissions if they exist
      const Permission = require('../models/Permission');
      const permissions = await Permission.find({});
      
      superAdminRole = await Role.create({
        name: 'superAdmin',
        description: 'Super Administrator',
        permissions: permissions.map(p => p._id),
        isActive: true
      });
      console.log('✅ SuperAdmin role created');
    } else {
      console.log('✅ SuperAdmin role found');
    }

    console.log('\n👤 Creating/updating superadmin user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'superadmin@idream.com' });
    
    if (existingUser) {
      // Update existing user
      existingUser.password = 'P@ssw0rd123';
      existingUser.role = superAdminRole._id;
      existingUser.isActive = true;
      existingUser.isEmailVerified = true;
      await existingUser.save();
      console.log('✅ SuperAdmin user updated');
    } else {
      // Create new user
      await User.create({
        email: 'superadmin@idream.com',
        password: 'P@ssw0rd123',
        phone: '+1234567890',
        role: superAdminRole._id,
        isActive: true,
        isEmailVerified: true
      });
      console.log('✅ SuperAdmin user created');
    }

    console.log('\n🔐 SuperAdmin Credentials:');
    console.log('   Email: superadmin@idream.com');
    console.log('   Password: P@ssw0rd123');
    console.log('\n✅ Done!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
};

createSuperAdmin();
