const Category = require('../models/Category');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

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
