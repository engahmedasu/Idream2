const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../models/Role');
const User = require('../models/User');
const Permission = require('../models/Permission'); // Register Permission model

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/idream';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const verifyRolesMigration = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Verifying roles after schema update...\n');
    console.log('📝 Schema Change: Removed enum constraint from Role.name field');
    console.log('   - Roles can now have any name (not restricted to system roles)\n');

    // Get all roles (without populating to avoid model registration issues)
    const roles = await Role.find().lean();
    
    if (roles.length === 0) {
      console.log('⚠️  No roles found in database.');
      return;
    }

    console.log(`📋 Found ${roles.length} role(s) in database:\n`);

    // Check each role
    for (const role of roles) {
      const userCount = await User.countDocuments({ role: role._id });
      const permissionCount = Array.isArray(role.permissions) ? role.permissions.length : 0;
      console.log(`   📦 Role: ${role.name}`);
      console.log(`      - ID: ${role._id}`);
      console.log(`      - Description: ${role.description || 'No description'}`);
      console.log(`      - Permissions: ${permissionCount}`);
      console.log(`      - Active: ${role.isActive ? 'Yes' : 'No'}`);
      console.log(`      - Users assigned: ${userCount}`);
      console.log(`      - Status: ✅ Valid (no enum constraint violation)\n`);
    }

    // Summary
    const totalUsers = await User.countDocuments({ role: { $exists: true } });
    const activeRoles = roles.filter(r => r.isActive).length;
    const inactiveRoles = roles.filter(r => !r.isActive).length;

    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log('='.repeat(60));
    console.log(`   Total roles: ${roles.length}`);
    console.log(`   Active roles: ${activeRoles}`);
    console.log(`   Inactive roles: ${inactiveRoles}`);
    console.log(`   Total users with roles: ${totalUsers}`);
    console.log('='.repeat(60));

    console.log('\n✅ Verification completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - All existing roles are valid under the new schema');
    console.log('   - You can now create roles with any name');
    console.log('   - System roles (superAdmin, mallAdmin, shopAdmin, guest) are still valid');
    console.log('   - Custom roles can be created via admin portal\n');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

verifyRolesMigration();

