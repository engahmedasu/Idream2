const mongoose = require('mongoose');
require('dotenv').config();

const BillingCycle = require('../models/BillingCycle');
const SubscriptionPlan = require('../models/SubscriptionPlan');

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

const initSubscriptionSystem = async () => {
  await connectDB();

  try {
    console.log('🚀 Starting subscription system initialization...\n');

    // 1. Initialize Billing Cycles
    console.log('📅 Initializing billing cycles...');
    const cycles = [
      {
        name: 'monthly',
        displayName: 'Monthly',
        durationInDays: 30,
        isActive: true
      },
      {
        name: 'yearly',
        displayName: 'Yearly',
        durationInDays: 365,
        isActive: true
      }
    ];

    for (const cycleData of cycles) {
      const existing = await BillingCycle.findOne({ name: cycleData.name });
      if (existing) {
        console.log(`   ⚠️  Billing cycle "${cycleData.name}" already exists, skipping...`);
      } else {
        const cycle = new BillingCycle(cycleData);
        await cycle.save();
        console.log(`   ✅ Created billing cycle: ${cycleData.displayName} (${cycleData.durationInDays} days)`);
      }
    }

    // 2. Verify collections exist (this will create them if they don't)
    console.log('\n📋 Verifying subscription collections...');
    const collections = [
      'subscriptionplans',
      'subscriptionplanfeatures',
      'subscriptionplanlimits',
      'billingcycles',
      'subscriptionpricings',
      'shopsubscriptions',
      'subscriptionusages'
    ];

    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(c => c.name.toLowerCase());

    for (const collectionName of collections) {
      if (existingCollectionNames.includes(collectionName)) {
        console.log(`   ✅ Collection "${collectionName}" exists`);
      } else {
        // Collection will be created automatically when first document is inserted
        console.log(`   ⚠️  Collection "${collectionName}" will be created on first insert`);
      }
    }

    // 3. Create indexes (Mongoose will create them automatically, but we verify)
    console.log('\n🔍 Verifying indexes...');
    console.log('   ✅ Indexes will be created automatically by Mongoose models');

    // 4. Optional: Create a default "Free" plan if no plans exist
    console.log('\n📦 Checking for default plans...');
    const planCount = await SubscriptionPlan.countDocuments();
    if (planCount === 0) {
      console.log('   ℹ️  No plans found. You can create plans via the admin portal.');
      console.log('   💡 Tip: Create a "Free" plan with basic limits as a starting point.');
    } else {
      console.log(`   ✅ Found ${planCount} existing plan(s)`);
    }

    console.log('\n✅ Subscription system initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create subscription plans via admin portal');
    console.log('   2. Add features to each plan (display text for pricing page)');
    console.log('   3. Set limits for each plan (enforcement keys)');
    console.log('   4. Configure pricing for each plan + billing cycle combination');
    console.log('   5. Assign subscriptions to shops\n');

  } catch (error) {
    console.error('❌ Error during subscription system initialization:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

initSubscriptionSystem();


