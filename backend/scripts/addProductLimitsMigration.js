const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionPlanLimit = require('../models/SubscriptionPlanLimit');
const User = require('../models/User');

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

const addProductLimitsMigration = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting product limits migration...\n');

    // Get all subscription plans
    const plans = await SubscriptionPlan.find();
    
    if (plans.length === 0) {
      console.log('⚠️  No subscription plans found. Nothing to migrate.');
      console.log('   💡 Limits will be created automatically when plans are created via admin portal.');
      return;
    }

    console.log(`📋 Found ${plans.length} subscription plan(s) to process\n`);

    // Get a superAdmin user for createdBy/updatedBy fields (optional)
    const superAdmin = await User.findOne({ 'role.name': 'superAdmin' });
    const adminUserId = superAdmin ? superAdmin._id : null;

    let plansUpdated = 0;
    let limitsAdded = 0;

    for (const plan of plans) {
      console.log(`\n📦 Processing plan: ${plan.displayName} (${plan._id})`);

      // Check if max_products limit exists
      const existingMaxProducts = await SubscriptionPlanLimit.findOne({
        subscriptionPlan: plan._id,
        limitKey: 'max_products'
      });

      // Check if max_hot_offers limit exists
      const existingMaxHotOffers = await SubscriptionPlanLimit.findOne({
        subscriptionPlan: plan._id,
        limitKey: 'max_hot_offers'
      });

      let planUpdated = false;

      // Add max_products limit if it doesn't exist
      if (!existingMaxProducts) {
        // Set default to -1 (unlimited) for existing plans to avoid breaking them
        // Admin can configure specific limits later via admin portal
        await SubscriptionPlanLimit.create({
          subscriptionPlan: plan._id,
          limitKey: 'max_products',
          limitValue: -1, // -1 means unlimited
          createdBy: adminUserId,
          updatedBy: adminUserId
        });
        console.log('   ✅ Added max_products limit: -1 (unlimited)');
        limitsAdded++;
        planUpdated = true;
      } else {
        console.log(`   ℹ️  max_products limit already exists: ${existingMaxProducts.limitValue}`);
      }

      // Add max_hot_offers limit if it doesn't exist
      if (!existingMaxHotOffers) {
        // Set default to -1 (unlimited) for existing plans to avoid breaking them
        // Admin can configure specific limits later via admin portal
        await SubscriptionPlanLimit.create({
          subscriptionPlan: plan._id,
          limitKey: 'max_hot_offers',
          limitValue: -1, // -1 means unlimited
          createdBy: adminUserId,
          updatedBy: adminUserId
        });
        console.log('   ✅ Added max_hot_offers limit: -1 (unlimited)');
        limitsAdded++;
        planUpdated = true;
      } else {
        console.log(`   ℹ️  max_hot_offers limit already exists: ${existingMaxHotOffers.limitValue}`);
      }

      if (planUpdated) {
        plansUpdated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Plans processed: ${plans.length}`);
    console.log(`   Plans updated: ${plansUpdated}`);
    console.log(`   Limits added: ${limitsAdded}`);
    console.log('='.repeat(60));

    if (limitsAdded > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Notes:');
      console.log('   - Default limit value: -1 (unlimited)');
      console.log('   - This prevents existing shops from being blocked');
      console.log('   - You can configure specific limits via admin portal:');
      console.log('     Subscription Plans → Select Plan → Limits section');
      console.log('   - Set limitKey: "max_products" or "max_hot_offers"');
      console.log('   - Set limitValue to desired number (e.g., 50, 100)');
      console.log('   - Use -1 for unlimited products/offers\n');
    } else {
      console.log('\n✅ All plans already have the required limits. No migration needed.\n');
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

addProductLimitsMigration();

