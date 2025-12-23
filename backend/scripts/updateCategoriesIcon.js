const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');

dotenv.config();

const updateCategoriesIcon = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idream', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Update all categories that don't have icon field or have null/undefined/empty icon
    const result = await Category.updateMany(
      { 
        $or: [
          { icon: { $exists: false } },
          { icon: null },
          { icon: undefined },
          { icon: '' }
        ]
      },
      { 
        $set: { icon: 'FiShoppingBag' }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} categories with default icon 'FiShoppingBag'`);
    console.log(`   Total categories matched: ${result.matchedCount}`);

    // Also ensure all categories have icon field set
    const allCategories = await Category.find({});
    console.log(`\n📊 Current categories icon status:`);
    allCategories.forEach(category => {
      console.log(`   - ${category.name}: icon = ${category.icon || 'MISSING'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating categories:', error);
    process.exit(1);
  }
};

updateCategoriesIcon();

