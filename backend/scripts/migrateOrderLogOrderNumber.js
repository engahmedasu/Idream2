const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OrderLog = require('../models/OrderLog');

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

const migrateOrderLogOrderNumber = async () => {
  await connectDB();

  try {
    console.log('\n🔄 Starting migration: Adding orderNumber to existing OrderLog documents...\n');

    // Find all orders without orderNumber
    const orders = await OrderLog.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' }
      ]
    });

    console.log(`📋 Found ${orders.length} order(s) to process\n`);

    if (orders.length === 0) {
      console.log('✅ No orders need migration. All orders already have orderNumber.');
      return;
    }

    let ordersUpdated = 0;
    let ordersSkipped = 0;
    const usedOrderNumbers = new Set();

    // First, get all existing orderNumbers to avoid duplicates
    const existingOrders = await OrderLog.find({
      orderNumber: { $exists: true, $ne: null, $ne: '' }
    });
    existingOrders.forEach(order => {
      if (order.orderNumber) {
        usedOrderNumbers.add(order.orderNumber);
      }
    });

    console.log(`   ℹ️  Found ${usedOrderNumbers.size} existing orderNumbers\n`);

    for (const order of orders) {
      // Generate unique order number
      let orderNumber = (Date.now() + Math.floor(Math.random() * 1000)).toString();
      let attempts = 0;

      // Ensure uniqueness
      while (usedOrderNumbers.has(orderNumber) && attempts < 10) {
        orderNumber = (Date.now() + Math.floor(Math.random() * 10000)).toString();
        attempts++;
      }

      // If still duplicate, use timestamp + user ID
      if (usedOrderNumbers.has(orderNumber)) {
        const userId = order.user ? order.user.toString().slice(-6).replace(/\D/g, '') : '000000';
        orderNumber = Date.now().toString() + userId;
      }

      order.orderNumber = orderNumber;
      usedOrderNumbers.add(orderNumber);
      await order.save();

      console.log(`   ✅ Updated order: ${order._id} - Added orderNumber: ${orderNumber}`);
      ordersUpdated++;
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const ordersWithoutOrderNumber = await OrderLog.countDocuments({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null },
        { orderNumber: '' }
      ]
    });

    // Check for duplicate orderNumbers
    const duplicateCheck = await OrderLog.aggregate([
      {
        $group: {
          _id: '$orderNumber',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 },
          _id: { $ne: null, $ne: '' }
        }
      }
    ]);

    if (ordersWithoutOrderNumber === 0) {
      console.log('   ✅ All orders now have orderNumber');
    } else {
      console.log(`   ⚠️  Warning: ${ordersWithoutOrderNumber} orders still missing orderNumber`);
    }

    if (duplicateCheck.length === 0) {
      console.log('   ✅ No duplicate orderNumbers found');
    } else {
      console.log(`   ⚠️  Warning: Found ${duplicateCheck.length} duplicate orderNumbers`);
      duplicateCheck.forEach(dup => {
        console.log(`      - orderNumber "${dup._id}" appears ${dup.count} times`);
      });
    }

    // Create/verify index
    console.log('\n📋 Creating/verifying orderNumber index...');
    try {
      await OrderLog.createIndexes();
      console.log('   ✅ Indexes verified/created');
    } catch (error) {
      console.log(`   ⚠️  Warning: Could not create indexes: ${error.message}`);
    }

    // Show summary
    const totalOrders = await OrderLog.countDocuments({});
    const ordersWithOrderNumber = await OrderLog.countDocuments({
      orderNumber: { $exists: true, $ne: null, $ne: '' }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Orders processed: ${orders.length}`);
    console.log(`   Orders updated: ${ordersUpdated}`);
    console.log(`   Orders skipped: ${ordersSkipped}`);
    console.log(`   Orders with orderNumber: ${ordersWithOrderNumber}`);
    console.log('='.repeat(60));

    if (ordersUpdated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Notes:');
      console.log('   - All orders now have unique orderNumber');
      console.log('   - orderNumber is a numeric string based on Unix timestamp');
      console.log('   - Unique index ensures no duplicate orderNumbers');
      console.log('   - Order numbers are displayed in the Reports section\n');
    } else {
      console.log('\n✅ All orders already have orderNumber. No migration needed.\n');
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

migrateOrderLogOrderNumber();

