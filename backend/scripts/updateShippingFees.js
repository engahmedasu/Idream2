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

const updateShippingFees = async () => {
  await connectDB();

  try {
    // Find products where shippingFees is missing or null
    const result = await Product.updateMany(
      {
        $or: [
          { shippingFees: { $exists: false } },
          { shippingFees: null }
        ]
      },
      { $set: { shippingFees: 0 } }
    );

    console.log(`✅ Updated ${result.modifiedCount || result.nModified || 0} products with default shippingFees = 0`);
  } catch (error) {
    console.error('❌ Error updating shipping fees:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

updateShippingFees();


