const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Role = require('../models/Role');

const updateUsersActivation = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/idream';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get guest and shopAdmin role IDs
    const guestRole = await Role.findOne({ name: 'guest' });
    const shopAdminRole = await Role.findOne({ name: 'shopAdmin' });
    const superAdminRole = await Role.findOne({ name: 'superAdmin' });

    if (!guestRole || !shopAdminRole || !superAdminRole) {
      console.log('⚠️  Some roles not found. Please run seed script first.');
      process.exit(1);
    }

    // Update all guest users to isActive: false (except if they're already false)
    const guestUsers = await User.find({ role: guestRole._id, isActive: true });
    if (guestUsers.length > 0) {
      await User.updateMany(
        { role: guestRole._id, isActive: true },
        { $set: { isActive: false } }
      );
      console.log(`✅ Updated ${guestUsers.length} guest user(s) to inactive`);
    } else {
      console.log('ℹ️  No active guest users to update');
    }

    // Update all shopAdmin users to isActive: false (except if they're already false)
    const shopAdminUsers = await User.find({ role: shopAdminRole._id, isActive: true });
    if (shopAdminUsers.length > 0) {
      await User.updateMany(
        { role: shopAdminRole._id, isActive: true },
        { $set: { isActive: false } }
      );
      console.log(`✅ Updated ${shopAdminUsers.length} shopAdmin user(s) to inactive`);
    } else {
      console.log('ℹ️  No active shopAdmin users to update');
    }

    // Ensure superAdmin users remain active
    const superAdminUsers = await User.find({ role: superAdminRole._id, isActive: false });
    if (superAdminUsers.length > 0) {
      await User.updateMany(
        { role: superAdminRole._id, isActive: false },
        { $set: { isActive: true } }
      );
      console.log(`✅ Updated ${superAdminUsers.length} superAdmin user(s) to active`);
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

updateUsersActivation();

