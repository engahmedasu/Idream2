const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Page = require('../models/Page');

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

const migratePagesCollection = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting Pages collection migration...\n');

    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('pages');

    // Check if collection exists and get its stats
    const collections = await db.listCollections({ name: 'pages' }).toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      console.log('📝 Pages collection does not exist. It will be created when first document is inserted.');
    } else {
      console.log('✅ Pages collection exists');
      
      // Get collection stats
      try {
        const stats = await db.command({ collStats: 'pages' });
        console.log(`   - Document count: ${stats.count || 0}`);
        console.log(`   - Size: ${stats.size ? (stats.size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
      } catch (error) {
        console.log('   - Could not retrieve collection stats');
      }
    }

    // Ensure indexes are created
    console.log('\n📋 Creating/verifying indexes...\n');

    // Get existing indexes
    const existingIndexes = await collection.indexes();
    console.log('   Existing indexes:');
    existingIndexes.forEach(index => {
      console.log(`     - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Create indexes using the model (Mongoose will handle this)
    // The unique index on slug is automatically created by unique: true
    // The compound index on isActive and order is defined in the schema
    await Page.createIndexes();
    console.log('\n   ✅ Indexes verified/created');

    // Verify the indexes were created correctly
    const indexesAfter = await collection.indexes();
    console.log('\n   Final indexes:');
    indexesAfter.forEach(index => {
      const isUnique = index.unique ? ' (unique)' : '';
      const isSparse = index.sparse ? ' (sparse)' : '';
      console.log(`     - ${index.name}: ${JSON.stringify(index.key)}${isUnique}${isSparse}`);
    });

    // Check for duplicate slugs (data integrity check)
    console.log('\n🔍 Checking data integrity...\n');
    const pages = await Page.find({});
    const slugs = pages.map(p => p.slug);
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    
    if (duplicateSlugs.length > 0) {
      console.log(`   ⚠️  Warning: Found duplicate slugs: ${duplicateSlugs.join(', ')}`);
      console.log('   💡 These should be unique. Please review and fix manually.');
    } else {
      console.log('   ✅ No duplicate slugs found');
    }

    // Verify schema structure
    console.log('\n📐 Verifying schema structure...\n');
    if (pages.length > 0) {
      const samplePage = pages[0];
      const requiredFields = ['slug', 'title', 'content', 'isActive', 'order'];
      const missingFields = requiredFields.filter(field => !(field in samplePage));
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Warning: Some pages may be missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log('   ✅ Schema structure is correct');
      }

      // Check bilingual fields
      if (samplePage.title && samplePage.title.en && samplePage.title.ar) {
        console.log('   ✅ Bilingual title structure is correct');
      } else {
        console.log('   ⚠️  Warning: Some pages may be missing bilingual title fields');
      }

      if (samplePage.content && samplePage.content.en && samplePage.content.ar) {
        console.log('   ✅ Bilingual content structure is correct');
      } else {
        console.log('   ⚠️  Warning: Some pages may be missing bilingual content fields');
      }
    } else {
      console.log('   ℹ️  No pages found. Schema will be validated when first page is created.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Collection exists: ${collectionExists ? 'Yes' : 'Will be created on first insert'}`);
    console.log(`   Total pages: ${pages.length}`);
    console.log(`   Indexes created: ${indexesAfter.length}`);
    console.log(`   Data integrity: ${duplicateSlugs.length === 0 ? 'OK' : 'Issues found'}`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - Unique index on "slug" field ensures no duplicate slugs');
    console.log('   - Compound index on "isActive" and "order" optimizes queries');
    console.log('   - All indexes are automatically maintained by MongoDB');
    console.log('   - To seed initial pages, run: npm run init-pages\n');

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

migratePagesCollection();

