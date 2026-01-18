const Category = require('../models/Category');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    let filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // If user is mallAdmin or Sales role, restrict to allowedCategories or shops they created
    if (req.user && req.user.role) {
      const roleName = req.user.role.name || req.user.role;
      if (roleName === 'mallAdmin' || roleName === 'Sales') {
        // If mallAdmin has allowedCategories defined, use those
        if (req.user.allowedCategories && req.user.allowedCategories.length > 0) {
          const categoryIds = req.user.allowedCategories.map(cat => cat._id || cat);
          filter._id = { $in: categoryIds };
        } else {
          // Fallback to categories from shops they created (for backward compatibility)
          const userShops = await Shop.find({ createdBy: req.user._id }).select('category');
          const categoryIds = userShops
            .map(shop => shop.category)
            .filter(cat => cat) // Remove null/undefined
            .map(cat => cat._id || cat) // Extract ID if populated
            .filter((catId, index, self) => self.indexOf(catId) === index); // Get unique IDs
          
          if (categoryIds.length > 0) {
            filter._id = { $in: categoryIds };
          } else {
            filter._id = { $in: [] };
          }
        }
      } else if (roleName === 'shopAdmin') {
        // For shopAdmin, restrict to their shop's category only
        if (req.user.shop) {
          const shop = await Shop.findById(req.user.shop).select('category');
          if (shop && shop.category) {
            filter._id = shop.category._id || shop.category;
          } else {
            filter._id = { $in: [] }; // No category if shop doesn't have one
          }
        } else {
          filter._id = { $in: [] }; // No categories if no shop assigned
        }
      }
    }

    const categories = await Category.find(filter)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ order: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID with shops and hot offers
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get hot offers for this category
    const hotOffers = await Product.find({
      category: category._id,
      isHotOffer: true,
      isActive: true
    })
      .populate('shop', 'name image')
      .sort({ priority: -1 })
      .limit(10);

    // Get shops for this category
    const shops = await Shop.find({
      category: category._id,
      isActive: true
    })
      .populate('category')
      .sort({ name: 1 });

    res.json({ category, hotOffers, shops });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    // Get the highest order value and add 1
    const maxOrderCategory = await Category.findOne().sort({ order: -1 });
    const nextOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;

    const categoryData = {
      ...req.body,
      image: req.file ? `/uploads/categories/${req.file.filename}` : '',
      order: req.body.order !== undefined ? req.body.order : nextOrder,
      createdBy: req.user._id
    };

    const category = await Category.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    if (req.file) {
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate/Deactivate category
exports.toggleCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.isActive = !category.isActive;
    category.updatedBy = req.user._id;
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category order
exports.updateOrder = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, order }

    const updatePromises = categories.map(({ id, order }) =>
      Category.findByIdAndUpdate(id, { order, updatedBy: req.user._id }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedCategories = await Category.find().sort({ order: 1, name: 1 });
    res.json(updatedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
