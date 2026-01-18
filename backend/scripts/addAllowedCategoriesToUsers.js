const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

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

const addAllowedCategoriesToUsers = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting migration: Adding allowedCategories field to existing User documents...\n');

    // Find all users without allowedCategories field
    const users = await User.find({
      $or: [
        { allowedCategories: { $exists: false } },
        { allowedCategories: null }
      ]
    });

    console.log(`📋 Found ${users.length} user(s) to process\n`);

    if (users.length === 0) {
      console.log('✅ No users need migration. All users already have allowedCategories field.');
      console.log('\n📊 Summary:');
      const totalUsers = await User.countDocuments({});
      const usersWithAllowedCategories = await User.countDocuments({ allowedCategories: { $exists: true } });
      console.log(`   Total users: ${totalUsers}`);
      console.log(`   With allowedCategories field: ${usersWithAllowedCategories}`);
      console.log(`   Without allowedCategories field: ${totalUsers - usersWithAllowedCategories}`);
      return;
    }

    // Update all users without allowedCategories field
    const result = await User.updateMany(
      {
        $or: [
          { allowedCategories: { $exists: false } },
          { allowedCategories: null }
        ]
      },
      {
        $set: { allowedCategories: [] }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount || result.nModified || 0} user(s)`);
    console.log(`📊 Total users matched: ${result.matchedCount || 0}`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const usersWithoutAllowedCategories = await User.countDocuments({
      $or: [
        { allowedCategories: { $exists: false } },
        { allowedCategories: null }
      ]
    });

    if (usersWithoutAllowedCategories === 0) {
      console.log('   ✅ All users now have allowedCategories field');
    } else {
      console.log(`   ⚠️  Warning: ${usersWithoutAllowedCategories} user(s) still missing allowedCategories field`);
    }

    // Get role information to show stats by role
    const Role = require('../models/Role');
    const mallAdminRole = await Role.findOne({ name: 'mallAdmin' });
    const mallAdminCount = mallAdminRole ? await User.countDocuments({ role: mallAdminRole._id }) : 0;
    const mallAdminWithCategories = mallAdminRole ? await User.countDocuments({ 
      role: mallAdminRole._id, 
      allowedCategories: { $exists: true, $ne: null, $not: { $size: 0 } } 
    }) : 0;

    // Show summary statistics
    const totalUsers = await User.countDocuments({});
    const usersWithEmptyCategories = await User.countDocuments({ 
      allowedCategories: { $exists: true, $eq: [] } 
    });
    const usersWithNonEmptyCategories = await User.countDocuments({ 
      allowedCategories: { $exists: true, $ne: null, $not: { $size: 0 } } 
    });
    const usersWithoutField = await User.countDocuments({
      $or: [
        { allowedCategories: { $exists: false } },
        { allowedCategories: null }
      ]
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   With allowedCategories: [] (empty): ${usersWithEmptyCategories}`);
    console.log(`   With allowedCategories: [categories] (non-empty): ${usersWithNonEmptyCategories}`);
    console.log(`   Without allowedCategories field: ${usersWithoutField}`);
    console.log(`   Users updated: ${result.modifiedCount || result.nModified || 0}`);
    if (mallAdminRole) {
      console.log(`\n   MallAdmin users: ${mallAdminCount}`);
      console.log(`   MallAdmin with assigned categories: ${mallAdminWithCategories}`);
    }
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - All existing users now have allowedCategories field set to [] (empty array)');
    console.log('   - New users will default to allowedCategories: []');
    console.log('   - Only MallAdmin users need allowedCategories assigned (via Admin Portal)');
    console.log('   - SuperAdmin can assign categories to MallAdmin when creating/updating their accounts');
    console.log('   - MallAdmin users can only access shops and products within their allowed categories\n');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

addAllowedCategoriesToUsers();
