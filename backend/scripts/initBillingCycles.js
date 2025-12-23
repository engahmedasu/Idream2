const mongoose = require('mongoose');
require('dotenv').config();

const BillingCycle = require('../models/BillingCycle');

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

const initBillingCycles = async () => {
  await connectDB();

  try {
    console.log('🚀 Initializing billing cycles...\n');

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

    console.log('\n✅ Billing cycles initialization completed!\n');
  } catch (error) {
    console.error('❌ Error initializing billing cycles:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

initBillingCycles();

