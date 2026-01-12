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

const migrateAdvertisementsCollection = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting Advertisements collection migration...\n');

    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('advertisements');

    // Check if collection exists and get its stats
    const collections = await db.listCollections({ name: 'advertisements' }).toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      console.log('📝 Advertisements collection does not exist. It will be created when first document is inserted.');
    } else {
      console.log('✅ Advertisements collection exists');
      
      // Get collection stats
      try {
        const stats = await db.command({ collStats: 'advertisements' });
        console.log(`   - Document count: ${stats.count || 0}`);
        console.log(`   - Size: ${stats.size ? (stats.size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
      } catch (error) {
        console.log('   - Could not retrieve collection stats');
      }
    }

    // Ensure indexes are created
    console.log('\n📋 Creating/verifying indexes...\n');

    // Get existing indexes only if collection exists
    let existingIndexes = [];
    if (collectionExists) {
      try {
        existingIndexes = await collection.indexes();
        console.log('   Existing indexes:');
        existingIndexes.forEach(index => {
          console.log(`     - ${index.name}: ${JSON.stringify(index.key)}`);
        });
      } catch (error) {
        console.log('   ⚠️  Could not retrieve existing indexes (collection may be empty)');
      }
    } else {
      console.log('   Collection does not exist yet, indexes will be created on first insert');
    }

    // Create indexes using the model (Mongoose will handle this)
    // This will create the collection and indexes if they don't exist
    try {
      await Advertisement.createIndexes();
      console.log('\n   ✅ Indexes verified/created');
    } catch (error) {
      console.log('   ⚠️  Note: Indexes will be created automatically when first document is inserted');
    }

    // Verify the indexes were created correctly
    const collectionsAfter = await db.listCollections({ name: 'advertisements' }).toArray();
    let indexesAfter = [];
    if (collectionsAfter.length > 0) {
      try {
        indexesAfter = await collection.indexes();
        console.log('\n   Final indexes:');
        indexesAfter.forEach(index => {
          const isUnique = index.unique ? ' (unique)' : '';
          const isSparse = index.sparse ? ' (sparse)' : '';
          console.log(`     - ${index.name}: ${JSON.stringify(index.key)}${isUnique}${isSparse}`);
        });
      } catch (error) {
        console.log('   ⚠️  Could not verify indexes (collection may be empty)');
      }
    } else {
      console.log('\n   ⚠️  Collection still does not exist. It will be created when first document is inserted.');
    }

    // Check data integrity
    console.log('\n🔍 Checking data integrity...\n');
    const advertisements = await Advertisement.find({}).populate('categories', 'name');
    
    // Check for required fields
    if (advertisements.length > 0) {
      const sampleAd = advertisements[0];
      const requiredFields = ['image', 'categories', 'side', 'isActive'];
      const missingFields = requiredFields.filter(field => !(field in sampleAd));
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Warning: Some advertisements may be missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log('   ✅ Schema structure is correct');
      }

      // Check side values
      const validSides = ['left', 'right'];
      const invalidSides = advertisements.filter(ad => !validSides.includes(ad.side));
      if (invalidSides.length > 0) {
        console.log(`   ⚠️  Warning: Found ${invalidSides.length} advertisement(s) with invalid side values`);
      } else {
        console.log('   ✅ All side values are valid');
      }

      // Check categories
      const adsWithoutCategories = advertisements.filter(ad => !ad.categories || ad.categories.length === 0);
      if (adsWithoutCategories.length > 0) {
        console.log(`   ⚠️  Warning: Found ${adsWithoutCategories.length} advertisement(s) without categories`);
      } else {
        console.log('   ✅ All advertisements have at least one category');
      }

      // Check date ranges
      const now = new Date();
      const adsWithInvalidDates = advertisements.filter(ad => {
        if (ad.startDate && ad.endDate) {
          return new Date(ad.startDate) > new Date(ad.endDate);
        }
        return false;
      });
      if (adsWithInvalidDates.length > 0) {
        console.log(`   ⚠️  Warning: Found ${adsWithInvalidDates.length} advertisement(s) with invalid date ranges (startDate > endDate)`);
      } else {
        console.log('   ✅ All date ranges are valid');
      }

      // Check active advertisements
      const activeAds = advertisements.filter(ad => ad.isActive);
      const expiredAds = advertisements.filter(ad => {
        if (!ad.isActive) return false;
        if (ad.endDate && new Date(ad.endDate) < now) return true;
        if (ad.startDate && new Date(ad.startDate) > now) return true;
        return false;
      });

      console.log(`\n   📊 Active advertisements: ${activeAds.length}`);
      if (expiredAds.length > 0) {
        console.log(`   ⚠️  Warning: Found ${expiredAds.length} active advertisement(s) that are outside their date range`);
      }

      // Statistics by side
      const sideCounts = {
        left: advertisements.filter(ad => ad.side === 'left').length,
        right: advertisements.filter(ad => ad.side === 'right').length
      };

      console.log('\n   📊 Side distribution:');
      Object.entries(sideCounts).forEach(([side, count]) => {
        console.log(`     - ${side}: ${count}`);
      });

      // Statistics by status
      const statusCounts = {
        active: advertisements.filter(ad => ad.isActive).length,
        inactive: advertisements.filter(ad => !ad.isActive).length
      };

      console.log('\n   📊 Status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });

      // Statistics by category
      const categoryMap = new Map();
      advertisements.forEach(ad => {
        if (ad.categories && ad.categories.length > 0) {
          ad.categories.forEach(cat => {
            const catName = typeof cat === 'object' ? cat.name : cat;
            categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
          });
        }
      });

      if (categoryMap.size > 0) {
        console.log('\n   📊 Category distribution (top 10):');
        const sortedCategories = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        sortedCategories.forEach(([catName, count]) => {
          console.log(`     - ${catName}: ${count}`);
        });
      }

      // Check redirect URLs
      const adsWithRedirect = advertisements.filter(ad => ad.redirectUrl && ad.redirectUrl.trim() !== '');
      console.log(`\n   📊 Advertisements with redirect URLs: ${adsWithRedirect.length} / ${advertisements.length}`);
    } else {
      console.log('   ℹ️  No advertisements found. Schema will be validated when first advertisement is created.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Collection exists: ${collectionExists ? 'Yes' : 'Will be created on first insert'}`);
    console.log(`   Total advertisements: ${advertisements.length}`);
    console.log(`   Indexes created: ${indexesAfter.length}`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - Index on "categories", "side", and "isActive" optimizes category-based queries');
    console.log('   - Index on "side" and "isActive" optimizes side-based queries');
    console.log('   - Index on "startDate" and "endDate" optimizes date range queries');
    console.log('   - Index on "priority" and "createdAt" optimizes sorting');
    console.log('   - All indexes are automatically maintained by MongoDB');
    console.log('   - Advertisements can be managed via: Admin Portal → Advertisements');
    console.log('   - Public API endpoint: GET /api/advertisements/active');
    console.log('   - Supported image formats: JPG, PNG, WebP');
    console.log('   - Recommended image size: 300×600 px minimum (vertical orientation)\n');

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

migrateAdvertisementsCollection();
