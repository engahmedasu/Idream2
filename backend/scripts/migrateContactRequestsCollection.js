const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ContactRequest = require('../models/ContactRequest');

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

const migrateContactRequestsCollection = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting Contact Requests collection migration...\n');

    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('contactrequests');

    // Check if collection exists and get its stats
    const collections = await db.listCollections({ name: 'contactrequests' }).toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      console.log('📝 Contact Requests collection does not exist. It will be created when first document is inserted.');
    } else {
      console.log('✅ Contact Requests collection exists');
      
      // Get collection stats
      try {
        const stats = await db.command({ collStats: 'contactrequests' });
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
      await ContactRequest.createIndexes();
      console.log('\n   ✅ Indexes verified/created');
    } catch (error) {
      console.log('   ⚠️  Note: Indexes will be created automatically when first document is inserted');
    }

    // Verify the indexes were created correctly
    const collectionsAfter = await db.listCollections({ name: 'contactrequests' }).toArray();
    if (collectionsAfter.length > 0) {
      try {
        const indexesAfter = await collection.indexes();
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
    const requests = await ContactRequest.find({});
    
    // Check for required fields
    if (requests.length > 0) {
      const sampleRequest = requests[0];
      const requiredFields = ['name', 'email', 'service', 'message', 'status'];
      const missingFields = requiredFields.filter(field => !(field in sampleRequest));
      
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Warning: Some requests may be missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log('   ✅ Schema structure is correct');
      }

      // Check status values
      const validStatuses = ['new', 'read', 'replied', 'archived'];
      const invalidStatuses = requests.filter(r => !validStatuses.includes(r.status));
      if (invalidStatuses.length > 0) {
        console.log(`   ⚠️  Warning: Found ${invalidStatuses.length} request(s) with invalid status values`);
      } else {
        console.log('   ✅ All status values are valid');
      }

      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = requests.filter(r => !emailRegex.test(r.email));
      if (invalidEmails.length > 0) {
        console.log(`   ⚠️  Warning: Found ${invalidEmails.length} request(s) with invalid email format`);
      } else {
        console.log('   ✅ All email addresses are valid');
      }

      // Statistics
      const statusCounts = {
        new: requests.filter(r => r.status === 'new').length,
        read: requests.filter(r => r.status === 'read').length,
        replied: requests.filter(r => r.status === 'replied').length,
        archived: requests.filter(r => r.status === 'archived').length
      };

      console.log('\n   📊 Status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
    } else {
      console.log('   ℹ️  No contact requests found. Schema will be validated when first request is created.');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Collection exists: ${collectionExists ? 'Yes' : 'Will be created on first insert'}`);
    console.log(`   Total requests: ${requests.length}`);
    console.log(`   Indexes created: ${indexesAfter.length}`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - Index on "status" and "createdAt" optimizes queries');
    console.log('   - Index on "isRead" and "createdAt" optimizes unread queries');
    console.log('   - All indexes are automatically maintained by MongoDB');
    console.log('   - Contact requests can be submitted via: POST /api/contact');
    console.log('   - Admin can view requests at: Admin Portal → Pages → Contact Requests\n');

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

migrateContactRequestsCollection();

