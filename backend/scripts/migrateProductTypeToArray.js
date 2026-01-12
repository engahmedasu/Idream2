const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');

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

const migrateProductTypeToArray = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting migration: Converting productType from String to Array...\n');

    // Find all products with productType as string (not array)
    const products = await Product.find({
      $or: [
        { productType: { $exists: true, $type: 'string' } },
        { productType: { $exists: false } },
        { productType: null }
      ]
    });

    console.log(`📋 Found ${products.length} product(s) to process\n`);

    if (products.length === 0) {
      console.log('✅ No products need migration. All products already have productType as array.');
      return;
    }

    let productsUpdated = 0;
    let productsSkipped = 0;

    for (const product of products) {
      let needsUpdate = false;
      let newProductType = [];
      const oldValue = product.productType;

      // Check if productType is a string (needs conversion)
      if (typeof product.productType === 'string') {
        if (product.productType.trim() === '') {
          // Empty string -> empty array
          newProductType = [];
        } else {
          // Non-empty string -> array with single element
          newProductType = [product.productType.trim()];
        }
        needsUpdate = true;
      } else if (!product.productType || product.productType === null) {
        // null or undefined -> empty array
        newProductType = [];
        needsUpdate = true;
      } else if (Array.isArray(product.productType)) {
        // Already an array, skip
        console.log(`   ℹ️  Product already has array productType: ${product.name} (${product._id})`);
        productsSkipped++;
        continue;
      }

      if (needsUpdate) {
        product.productType = newProductType;
        await product.save();
        const oldValueDisplay = typeof oldValue === 'string' ? oldValue : (oldValue === null ? 'null' : 'undefined');
        console.log(`   ✅ Updated product: ${product.name} (${product._id}) - Converted "${oldValueDisplay}" to [${newProductType.join(', ')}]`);
        productsUpdated++;
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const productsWithStringType = await Product.find({
      productType: { $type: 'string' }
    });

    if (productsWithStringType.length === 0) {
      console.log('   ✅ All products now have productType as array');
    } else {
      console.log(`   ⚠️  Warning: ${productsWithStringType.length} products still have productType as string`);
    }

    // Show summary
    const totalProducts = await Product.countDocuments({});
    const productsWithArrayType = await Product.countDocuments({
      productType: { $type: 'array' }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Products processed: ${products.length}`);
    console.log(`   Products updated: ${productsUpdated}`);
    console.log(`   Products skipped: ${productsSkipped}`);
    console.log(`   Products with array productType: ${productsWithArrayType}`);
    console.log('='.repeat(60));

    if (productsUpdated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Notes:');
      console.log('   - All productType fields are now arrays');
      console.log('   - String values were converted to single-element arrays');
      console.log('   - Empty strings and null values were converted to empty arrays');
      console.log('   - You can now select multiple product types when creating/editing products\n');
    } else {
      console.log('\n✅ All products already have productType as array. No migration needed.\n');
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

migrateProductTypeToArray();

