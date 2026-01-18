const Shop = require('../models/Shop');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { attachRatingsToProducts } = require('./productController');

// Helper function to validate Egyptian phone number format (+20XXXXXXXXXX)
const validateEgyptianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required' };
  }
  const trimmedPhone = phone.trim();
  if (!trimmedPhone.startsWith('+20')) {
    return { valid: false, message: 'Phone number must start with +20 (Egypt international format)' };
  }
  // Check if it's a valid Egyptian phone number: +20 followed by 10 digits
  const phoneDigits = trimmedPhone.replace(/\D/g, ''); // Remove all non-digits
  if (phoneDigits.length !== 12 || !phoneDigits.startsWith('20')) {
    return { valid: false, message: 'Phone number must be in format: +20XXXXXXXXXX (12 digits including country code)' };
  }
  return { valid: true, message: '' };
};

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    const filter = {};

    // If user is mallAdmin or Sales role, restrict to shops based on allowedCategories
    if (req.user && req.user.role) {
      const roleName = req.user.role.name || req.user.role;
      if (roleName === 'mallAdmin' || roleName === 'Sales') {
        // If mallAdmin has allowedCategories defined, use those
        if (req.user.allowedCategories && req.user.allowedCategories.length > 0) {
          const categoryIds = req.user.allowedCategories.map(cat => cat._id || cat);
          filter.category = { $in: categoryIds };
        } else {
          // Fallback to shops they created (for backward compatibility)
          filter.createdBy = req.user._id;
        }
      }
    }

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const shops = await Shop.find(filter)
      .populate('category')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('approvedBy', 'email')
      .sort({ priority: -1, createdAt: -1 });

    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shop by ID
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('category')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('approvedBy', 'email');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // If user is mallAdmin or Sales role, ensure they can only access shops they created
    if (req.user && req.user.role) {
      const roleName = req.user.role.name || req.user.role;
      if (roleName === 'mallAdmin' || roleName === 'Sales') {
        if (shop.createdBy._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied. You can only access shops you created.' });
        }
      }
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shop by share link
exports.getShopByShareLink = async (req, res) => {
  try {
    const shop = await Shop.findOne({ shareLink: req.params.shareLink, isActive: true })
      .populate('category');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    let products = await Product.find({ shop: shop._id, isActive: true })
      .populate('category')
      .sort({ priority: -1, createdAt: -1 });

    // Attach ratings to products
    products = await attachRatingsToProducts(products);

    res.json({ shop, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create shop (registration)
exports.createShop = async (req, res) => {
  try {
    // Validate mobile number
    if (req.body.mobile) {
      const mobileValidation = validateEgyptianPhone(req.body.mobile);
      if (!mobileValidation.valid) {
        return res.status(400).json({ message: `Mobile: ${mobileValidation.message}` });
      }
    }

    // Validate WhatsApp number
    if (req.body.whatsapp) {
      const whatsappValidation = validateEgyptianPhone(req.body.whatsapp);
      if (!whatsappValidation.valid) {
        return res.status(400).json({ message: `WhatsApp: ${whatsappValidation.message}` });
      }
    }

    const shopData = {
      ...req.body,
      image: req.file ? `/uploads/shops/${req.file.filename}` : '',
      createdBy: req.user?._id
    };

    // Convert priority to number if provided
    if (shopData.priority !== undefined) {
      shopData.priority = parseInt(shopData.priority) || 0;
    }

    // Handle productTypes - can be JSON string or array
    if (shopData.productTypes) {
      if (typeof shopData.productTypes === 'string') {
        try {
          shopData.productTypes = JSON.parse(shopData.productTypes);
        } catch {
          // If not valid JSON, treat as comma-separated string
          shopData.productTypes = shopData.productTypes.split(',').map(t => t.trim()).filter(t => t);
        }
      }
    } else {
      shopData.productTypes = [];
    }

    const shop = await Shop.create(shopData);

    // If user is creating their own shop, link it
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { shop: shop._id });
    }

    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update shop
exports.updateShop = async (req, res) => {
  try {
    // If user is mallAdmin or Sales role, ensure they can only update shops they created
    if (req.user && req.user.role) {
      const roleName = req.user.role.name || req.user.role;
      if (roleName === 'mallAdmin' || roleName === 'Sales') {
        const existingShop = await Shop.findById(req.params.id);
        if (!existingShop) {
          return res.status(404).json({ message: 'Shop not found' });
        }
        if (existingShop.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied. You can only update shops you created.' });
        }
      }
    }

    // Validate mobile number if provided
    if (req.body.mobile !== undefined) {
      const mobileValidation = validateEgyptianPhone(req.body.mobile);
      if (!mobileValidation.valid) {
        return res.status(400).json({ message: `Mobile: ${mobileValidation.message}` });
      }
    }

    // Validate WhatsApp number if provided
    if (req.body.whatsapp !== undefined) {
      const whatsappValidation = validateEgyptianPhone(req.body.whatsapp);
      if (!whatsappValidation.valid) {
        return res.status(400).json({ message: `WhatsApp: ${whatsappValidation.message}` });
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Convert priority to number if provided
    if (updateData.priority !== undefined) {
      updateData.priority = parseInt(updateData.priority) || 0;
    }

    // Handle productTypes - can be JSON string or array
    if (updateData.productTypes !== undefined) {
      if (typeof updateData.productTypes === 'string') {
        try {
          updateData.productTypes = JSON.parse(updateData.productTypes);
        } catch {
          // If not valid JSON, treat as comma-separated string
          updateData.productTypes = updateData.productTypes.split(',').map(t => t.trim()).filter(t => t);
        }
      }
    }

    if (req.file) {
      updateData.image = `/uploads/shops/${req.file.filename}`;
    }

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete shop
exports.deleteShop = async (req, res) => {
  try {
    // If user is mallAdmin or Sales role, ensure they can only delete shops they created
    if (req.user && req.user.role) {
      const roleName = req.user.role.name || req.user.role;
      if (roleName === 'mallAdmin' || roleName === 'Sales') {
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
          return res.status(404).json({ message: 'Shop not found' });
        }
        if (shop.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied. You can only delete shops you created.' });
        }
      }
    }

    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Delete associated products
    await Product.deleteMany({ shop: shop._id });

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Activate shop (also activates the user account and subscription)
exports.activateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('createdBy');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Verify shop
    shop.isActive = true;
    shop.isApproved = true;
    shop.approvedBy = req.user._id;
    shop.approvedAt = new Date();
    shop.updatedBy = req.user._id;
    await shop.save();

    // Also activate the user account (shop owner)
    if (shop.createdBy) {
      const user = await User.findById(shop.createdBy._id || shop.createdBy);
      if (user) {
        user.isActive = true;
        await user.save();
      }
    }

    // Activate the shop subscription if it exists
    const ShopSubscription = require('../models/ShopSubscription');
    const subscription = await ShopSubscription.findOne({ shop: shop._id });
    if (subscription && subscription.status === 'pending') {
      // Calculate new dates from approval date
      const BillingCycle = require('../models/BillingCycle');
      const billingCycle = await BillingCycle.findById(subscription.billingCycle);
      if (billingCycle) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + billingCycle.durationInDays);
        
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.status = 'active';
        subscription.updatedBy = req.user._id;
        await subscription.save();
      }
    }

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate shop
exports.deactivateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.isActive = false;
    shop.updatedBy = req.user._id;
    await shop.save();

    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

