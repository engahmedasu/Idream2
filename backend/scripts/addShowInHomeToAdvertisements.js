const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Advertisement = require('../models/Advertisement');

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

const addShowInHomeToAdvertisements = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting migration: Adding showInHome field to existing Advertisement documents...\n');

    // Find all advertisements without showInHome field
    const advertisements = await Advertisement.find({
      $or: [
        { showInHome: { $exists: false } },
        { showInHome: null }
      ]
    });

    console.log(`📋 Found ${advertisements.length} advertisement(s) to process\n`);

    if (advertisements.length === 0) {
      console.log('✅ No advertisements need migration. All advertisements already have showInHome field.');
      console.log('\n📊 Summary:');
      const totalAds = await Advertisement.countDocuments({});
      const adsWithShowInHome = await Advertisement.countDocuments({ showInHome: { $exists: true } });
      console.log(`   Total advertisements: ${totalAds}`);
      console.log(`   With showInHome field: ${adsWithShowInHome}`);
      console.log(`   Without showInHome field: ${totalAds - adsWithShowInHome}`);
      return;
    }

    // Update all advertisements without showInHome field
    const result = await Advertisement.updateMany(
      {
        $or: [
          { showInHome: { $exists: false } },
          { showInHome: null }
        ]
      },
      {
        $set: { showInHome: false }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount || result.nModified || 0} advertisement(s)`);
    console.log(`📊 Total advertisements matched: ${result.matchedCount || 0}`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const adsWithoutShowInHome = await Advertisement.countDocuments({
      $or: [
        { showInHome: { $exists: false } },
        { showInHome: null }
      ]
    });

    if (adsWithoutShowInHome === 0) {
      console.log('   ✅ All advertisements now have showInHome field');
    } else {
      console.log(`   ⚠️  Warning: ${adsWithoutShowInHome} advertisement(s) still missing showInHome field`);
    }

    // Show summary statistics
    const totalAds = await Advertisement.countDocuments({});
    const adsWithShowInHomeTrue = await Advertisement.countDocuments({ showInHome: true });
    const adsWithShowInHomeFalse = await Advertisement.countDocuments({ showInHome: false });
    const adsWithoutField = await Advertisement.countDocuments({
      $or: [
        { showInHome: { $exists: false } },
        { showInHome: null }
      ]
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Total advertisements: ${totalAds}`);
    console.log(`   With showInHome: true: ${adsWithShowInHomeTrue}`);
    console.log(`   With showInHome: false: ${adsWithShowInHomeFalse}`);
    console.log(`   Without showInHome field: ${adsWithoutField}`);
    console.log(`   Advertisements updated: ${result.modifiedCount || result.nModified || 0}`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - All existing advertisements now have showInHome field set to false');
    console.log('   - New advertisements will default to showInHome: false');
    console.log('   - Admins can enable showInHome via the Admin Portal when creating/editing advertisements');
    console.log('   - Only advertisements with showInHome: true will appear on the home page\n');

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

addShowInHomeToAdvertisements();
