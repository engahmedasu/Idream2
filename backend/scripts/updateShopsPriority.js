const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');

dotenv.config();

const updateShopsPriority = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idream', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Update all shops that don't have priority field or have null/undefined priority
    const result = await Shop.updateMany(
      { 
        $or: [
          { priority: { $exists: false } },
          { priority: null },
          { priority: undefined }
        ]
      },
      { 
        $set: { priority: 0 }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} shops with default priority of 0`);
    console.log(`   Total shops matched: ${result.matchedCount}`);

    // Also ensure all shops have priority field set (in case some have other values)
    const allShops = await Shop.find({});
    console.log(`\n📊 Current shops priority status:`);
    allShops.forEach(shop => {
      console.log(`   - ${shop.name}: priority = ${shop.priority !== undefined ? shop.priority : 'MISSING'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating shops:', error);
    process.exit(1);
  }
};

updateShopsPriority();

