const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');

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

const addWebsiteToShopsMigration = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting website field migration for shops...\n');

    // Get all shops
    const shops = await Shop.find();
    
    if (shops.length === 0) {
      console.log('⚠️  No shops found. Nothing to migrate.');
      return;
    }

    console.log(`📋 Found ${shops.length} shop(s) to process\n`);

    let shopsUpdated = 0;
    let shopsSkipped = 0;

    for (const shop of shops) {
      // Check if website field exists and is not undefined
      if (shop.website === undefined) {
        // Set website to empty string if it doesn't exist
        shop.website = '';
        await shop.save();
        console.log(`   ✅ Updated shop: ${shop.name} (${shop._id}) - Added website field`);
        shopsUpdated++;
      } else {
        console.log(`   ℹ️  Shop already has website field: ${shop.name} (${shop._id})`);
        shopsSkipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Shops processed: ${shops.length}`);
    console.log(`   Shops updated: ${shopsUpdated}`);
    console.log(`   Shops skipped: ${shopsSkipped}`);
    console.log('='.repeat(60));

    if (shopsUpdated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Notes:');
      console.log('   - All shops now have the "website" field');
      console.log('   - Default value: empty string ("")');
      console.log('   - You can update shop websites via admin portal:');
      console.log('     Shops → Select Shop → Edit → Website field\n');
    } else {
      console.log('\n✅ All shops already have the website field. No migration needed.\n');
    }

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

addWebsiteToShopsMigration();

