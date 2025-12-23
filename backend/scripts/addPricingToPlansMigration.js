const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const BillingCycle = require('../models/BillingCycle');
const SubscriptionPricing = require('../models/SubscriptionPricing');
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

const addPricingToPlansMigration = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting pricing migration for subscription plans...\n');

    // Get or create monthly and yearly billing cycles
    let monthlyCycle = await BillingCycle.findOne({ name: 'monthly' });
    let yearlyCycle = await BillingCycle.findOne({ name: 'yearly' });

    if (!monthlyCycle) {
      console.log('⚠️  Monthly billing cycle not found. Creating it...');
      monthlyCycle = await BillingCycle.create({
        name: 'monthly',
        displayName: 'Monthly',
        durationInDays: 30,
        isActive: true
      });
      console.log('   ✅ Created monthly billing cycle');
    } else {
      console.log('✅ Monthly billing cycle found');
    }

    if (!yearlyCycle) {
      console.log('⚠️  Yearly billing cycle not found. Creating it...');
      yearlyCycle = await BillingCycle.create({
        name: 'yearly',
        displayName: 'Yearly',
        durationInDays: 365,
        isActive: true
      });
      console.log('   ✅ Created yearly billing cycle');
    } else {
      console.log('✅ Yearly billing cycle found');
    }

    // Get all subscription plans
    const plans = await SubscriptionPlan.find();
    
    if (plans.length === 0) {
      console.log('⚠️  No subscription plans found. Nothing to migrate.');
      return;
    }

    console.log(`\n📋 Found ${plans.length} subscription plan(s) to process\n`);

    // Get a superAdmin user for createdBy/updatedBy fields (optional)
    const superAdmin = await User.findOne({ 'role.name': 'superAdmin' });
    const adminUserId = superAdmin ? superAdmin._id : null;

    let plansProcessed = 0;
    let pricingRecordsAdded = 0;

    for (const plan of plans) {
      console.log(`\n📦 Processing plan: ${plan.displayName} (${plan._id})`);

      let planUpdated = false;

      // Check if monthly pricing exists
      const existingMonthlyPricing = await SubscriptionPricing.findOne({
        subscriptionPlan: plan._id,
        billingCycle: monthlyCycle._id
      });

      // Check if yearly pricing exists
      const existingYearlyPricing = await SubscriptionPricing.findOne({
        subscriptionPlan: plan._id,
        billingCycle: yearlyCycle._id
      });

      // Add monthly pricing if it doesn't exist (don't set default price, leave it to admin)
      if (!existingMonthlyPricing) {
        // We won't create pricing with 0 price, just log that it's missing
        console.log(`   ℹ️  Monthly pricing not found for this plan`);
        console.log(`   💡 You can set monthly pricing via the plan edit form`);
        planUpdated = true;
      } else {
        console.log(`   ✅ Monthly pricing exists: ${existingMonthlyPricing.currency || 'USD'} ${existingMonthlyPricing.price}`);
      }

      // Add yearly pricing if it doesn't exist
      if (!existingYearlyPricing) {
        console.log(`   ℹ️  Yearly pricing not found for this plan`);
        console.log(`   💡 You can set yearly pricing via the plan edit form`);
        planUpdated = true;
      } else {
        console.log(`   ✅ Yearly pricing exists: ${existingYearlyPricing.currency || 'USD'} ${existingYearlyPricing.price}`);
      }

      if (planUpdated) {
        plansProcessed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Plans processed: ${plans.length}`);
    console.log(`   Plans needing pricing: ${plansProcessed}`);
    console.log(`   Billing cycles verified: Monthly ✅, Yearly ✅`);
    console.log('='.repeat(60));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Notes:');
    console.log('   - Monthly and yearly billing cycles are available');
    console.log('   - You can now set pricing via the plan edit form:');
    console.log('     Subscription Plans → Select Plan → Edit → Set Monthly/Yearly Price');
    console.log('   - Existing pricing records were preserved');
    console.log('   - Plans without pricing can be updated via the admin portal\n');

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

addPricingToPlansMigration();

