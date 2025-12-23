const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SubscriptionLog = require('../models/SubscriptionLog');

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

const initSubscriptionLogs = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Initializing SubscriptionLog collection and indexes...\n');

    // Ensure indexes are created
    // The model defines these indexes:
    // - { shop: 1, createdAt: -1 }
    // - { createdAt: -1 }
    console.log('📊 Creating indexes...');
    
    // Create indexes using ensureIndexes (Mongoose will create them if they don't exist)
    await SubscriptionLog.ensureIndexes();
    console.log('   ✅ Indexes created/verified');

    // Get index information
    const indexes = await SubscriptionLog.collection.getIndexes();
    console.log('\n📋 Indexes on subscriptionlogs collection:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}:`, JSON.stringify(indexes[indexName]));
    });

    // Check if collection exists and has any documents
    const count = await SubscriptionLog.countDocuments();
    console.log(`\n📊 Current subscription logs count: ${count}`);

    if (count === 0) {
      console.log('   ℹ️  Collection is empty (this is normal for a new installation)');
      console.log('   ℹ️  Logs will be created automatically when subscriptions are set/updated');
    }

    console.log('\n✅ SubscriptionLog collection initialized successfully!');
    console.log('\n📝 Notes:');
    console.log('   - Collection will be created automatically when first log is inserted');
    console.log('   - Indexes are in place for optimal query performance');
    console.log('   - Logs are created automatically when shop subscriptions are set/updated\n');
  } catch (error) {
    console.error('❌ Error initializing subscription logs:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

initSubscriptionLogs();

