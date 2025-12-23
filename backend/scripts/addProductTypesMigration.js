const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/idream';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const migrateProductTypes = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting migration: Adding productTypes and productType fields...\n');

    // 1. Add productTypes field to Shop documents
    console.log('📦 Updating Shop documents...');
    const shopResult = await Shop.updateMany(
      {
        $or: [
          { productTypes: { $exists: false } },
          { productTypes: null }
        ]
      },
      {
        $set: { productTypes: [] }
      }
    );
    console.log(`   ✅ Updated ${shopResult.modifiedCount || shopResult.nModified || 0} shops`);
    console.log(`   📊 Total shops matched: ${shopResult.matchedCount || 0}`);

    // 2. Add productType field to Product documents
    console.log('\n📦 Updating Product documents...');
    const productResult = await Product.updateMany(
      {
        $or: [
          { productType: { $exists: false } },
          { productType: null }
        ]
      },
      {
        $set: { productType: '' }
      }
    );
    console.log(`   ✅ Updated ${productResult.modifiedCount || productResult.nModified || 0} products`);
    console.log(`   📊 Total products matched: ${productResult.matchedCount || 0}`);

    // 3. Verify the migration
    console.log('\n🔍 Verifying migration...');
    const shopsWithoutProductTypes = await Shop.countDocuments({
      $or: [
        { productTypes: { $exists: false } },
        { productTypes: null }
      ]
    });
    const productsWithoutProductType = await Product.countDocuments({
      $or: [
        { productType: { $exists: false } },
        { productType: null }
      ]
    });

    if (shopsWithoutProductTypes === 0 && productsWithoutProductType === 0) {
      console.log('   ✅ Migration completed successfully!');
      console.log('   ✅ All shops have productTypes field');
      console.log('   ✅ All products have productType field');
    } else {
      console.log(`   ⚠️  Warning: ${shopsWithoutProductTypes} shops and ${productsWithoutProductType} products still need migration`);
    }

    // 4. Show summary
    const totalShops = await Shop.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    console.log('\n📊 Migration Summary:');
    console.log(`   Total Shops: ${totalShops}`);
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Shops with productTypes: ${totalShops - shopsWithoutProductTypes}`);
    console.log(`   Products with productType: ${totalProducts - productsWithoutProductType}`);

    console.log('\n✅ Migration completed!\n');
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

migrateProductTypes();

