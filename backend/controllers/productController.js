const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Config = require('../models/Config');
const Review = require('../models/Review');
const ShopSubscription = require('../models/ShopSubscription');
const SubscriptionPlanLimit = require('../models/SubscriptionPlanLimit');
const mongoose = require('mongoose');

// Helper to attach averageRating and totalReviews to product documents
exports.attachRatingsToProducts = async (products) => {
  if (!products || products.length === 0) return products;

  const productIds = products.map((p) => {
    const id = p._id || p.id;
    // Ensure we're using ObjectId for comparison
    if (mongoose.Types.ObjectId.isValid(id)) {
      return id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id);
    }
    return id;
  });

  const ratings = await Review.aggregate([
    {
      $match: {
        product: { $in: productIds },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const ratingMap = new Map();
  ratings.forEach((r) => {
    // Convert _id to string for comparison
    const productIdStr = r._id.toString();
    ratingMap.set(productIdStr, {
      averageRating: r.averageRating || 0, // Store actual average
      totalReviews: r.totalReviews || 0
    });
  });

  // Convert to plain objects and set rating properties
  // Priority: Calculate from reviews (most accurate), fallback to stored DB values
  const productsWithRatings = products.map((product) => {
    const productObj = product.toObject ? product.toObject() : product;
    const productIdStr = productObj._id.toString();
    const r = ratingMap.get(productIdStr);
    
    // If reviews exist in aggregation, use that (most accurate)
    if (r && r.totalReviews > 0) {
      productObj.averageRating = Number((r.averageRating || 0).toFixed(2));
      productObj.totalReviews = r.totalReviews || 0;
    } else if (productObj.averageRating !== undefined && productObj.totalReviews !== undefined && productObj.totalReviews > 0) {
      // If no aggregation result but stored DB values exist and have reviews, use stored value
      productObj.averageRating = productObj.averageRating || 0;
      productObj.totalReviews = productObj.totalReviews || 0;
    } else {
      // If no reviews, set minimum rating to 2.5
      productObj.averageRating = 2.5;
      productObj.totalReviews = 0;
    }
    
    return productObj;
  });

  return productsWithRatings;
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { shop, category, isHotOffer, isActive, search, sortBy = 'priority' } = req.query;
    const filter = {};

    // If user is shopAdmin, restrict to their shop only
    if (req.user && req.user.role?.name === 'shopAdmin' && req.user.shop) {
      filter.shop = req.user.shop;
    } 
    // If user is mallAdmin, restrict to products from shops in allowedCategories or shops they created
    else if (req.user && req.user.role?.name === 'mallAdmin') {
      // If mallAdmin has allowedCategories defined, use those
      if (req.user.allowedCategories && req.user.allowedCategories.length > 0) {
        const categoryIds = req.user.allowedCategories.map(cat => cat._id || cat);
        // Get shops in these categories
        const userShops = await Shop.find({ category: { $in: categoryIds } }).select('_id');
        const shopIds = userShops.map(s => s._id);
        if (shopIds.length > 0) {
          filter.shop = { $in: shopIds };
        } else {
          filter.shop = { $in: [] };
        }
      } else {
        // Fallback to shops they created (for backward compatibility)
        const userShops = await Shop.find({ createdBy: req.user._id }).select('_id');
        const shopIds = userShops.map(s => s._id);
        if (shopIds.length > 0) {
          filter.shop = { $in: shopIds };
        } else {
          filter.shop = { $in: [] };
        }
      }
    } 
    else if (shop) {
      filter.shop = shop;
    }

    if (category) filter.category = category;
    if (isHotOffer !== undefined) filter.isHotOffer = isHotOffer === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sort = {};
    if (sortBy === 'priority') {
      sort = { priority: -1, createdAt: -1 };
    } else if (sortBy === 'price') {
      sort = { price: 1 };
    } else {
      sort = { createdAt: -1 };
    }

    let products = await Product.find(filter)
      .populate('shop', 'name image')
      .populate('category', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('approvedBy', 'email')
      .sort(sort);

    products = await exports.attachRatingsToProducts(products);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shop')
      .populate('category')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use stored rating from DB (already calculated correctly)
    // If not available, calculate from reviews
    if (product.averageRating === undefined || product.totalReviews === undefined) {
      const reviews = await Review.find({
        product: product._id,
        isActive: true
      });

      const totalReviews = reviews.length;
      if (totalReviews > 0) {
        // Calculate actual average from reviews (no minimum applied when reviews exist)
        const calculatedRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        product.averageRating = calculatedRating;
        product.totalReviews = totalReviews;
      } else {
        // If no reviews, set minimum to 2.5
        product.averageRating = 2.5;
        product.totalReviews = 0;
      }
    }
    // Use stored value as-is (no need to apply minimum if reviews exist)

    // If user is shopAdmin, ensure they can only access their shop's products
    if (req.user && req.user.role?.name === 'shopAdmin' && req.user.shop) {
      const shopId = product.shop?._id || product.shop;
      if (!shopId || shopId.toString() !== req.user.shop.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only access products from your shop.' });
      }
    }
    // If user is mallAdmin, ensure they can only access products from shops they created
    else if (req.user && req.user.role?.name === 'mallAdmin') {
      const shopId = product.shop?._id || product.shop;
      if (!shopId) {
        return res.status(400).json({ message: 'Product shop not found' });
      }
      const shop = await Shop.findById(shopId);
      if (!shop || shop.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only access products from shops you created.' });
      }
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get hot offers
exports.getHotOffers = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const filter = { isHotOffer: true, isActive: true };

    if (category) filter.category = category;

    let products = await Product.find(filter)
      .populate('shop', 'name image')
      .populate('category', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));

    products = await exports.attachRatingsToProducts(products);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      image: req.file ? `/uploads/products/${req.file.filename}` : (req.body.image || ''),
      shop: req.body.shop || req.user.shop,
      createdBy: req.user._id
    };

    // Validate required fields
    const validationErrors = [];
    
    if (!productData.name || !productData.name.trim()) {
      validationErrors.push('Product name is required');
    }
    
    if (!productData.description || !productData.description.trim()) {
      validationErrors.push('Product description is required');
    }
    
    if (!productData.image || !productData.image.trim()) {
      validationErrors.push('Product image is required');
    }
    
    if (!productData.price || productData.price === '' || isNaN(productData.price) || parseFloat(productData.price) <= 0) {
      validationErrors.push('Product price is required and must be greater than 0');
    }
    
    if (!productData.shop) {
      validationErrors.push('Shop is required');
    }
    
    if (!productData.category) {
      validationErrors.push('Category is required');
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: validationErrors.join('. ')
      });
    }

    // Convert priority to number if provided
    if (productData.priority !== undefined) {
      productData.priority = parseInt(productData.priority) || 0;
    }

    // Convert price to number if provided
    if (productData.price !== undefined) {
      productData.price = parseFloat(productData.price) || 0;
    }

   // Convert shipping fees to number if provided
  if (productData.shippingFees !== undefined) {
    productData.shippingFees = parseFloat(productData.shippingFees) || 0;
  }

    // Handle averageRating - validate and convert to number if provided
    if (productData.averageRating !== undefined && productData.averageRating !== '' && productData.averageRating !== null) {
      const rating = parseFloat(productData.averageRating);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        productData.averageRating = rating;
        // Set totalReviews to 1 if rating is manually set (to indicate it has a rating)
        if (!productData.totalReviews || productData.totalReviews === 0) {
          productData.totalReviews = 1;
        }
      } else {
        return res.status(400).json({ message: 'Rating must be a number between 0 and 5' });
      }
    } else {
      // If no rating provided, use default (will be set by model default or existing logic)
      delete productData.averageRating;
    }

    // Convert boolean fields
    if (productData.isHotOffer !== undefined) {
      productData.isHotOffer = productData.isHotOffer === 'true' || productData.isHotOffer === true;
    }

    // Handle productType - can be JSON string, array, or comma-separated string
    if (productData.productType !== undefined) {
      if (typeof productData.productType === 'string') {
        // Try parsing as JSON first
        try {
          const parsed = JSON.parse(productData.productType);
          productData.productType = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch {
          // If not valid JSON, check if it's comma-separated or single value
          if (productData.productType.includes(',')) {
            productData.productType = productData.productType.split(',').map(t => t.trim()).filter(t => t);
          } else if (productData.productType.trim()) {
            productData.productType = [productData.productType.trim()];
          } else {
            productData.productType = [];
          }
        }
      } else if (Array.isArray(productData.productType)) {
        // Already an array, just filter out empty values
        productData.productType = productData.productType.filter(t => t && t.trim());
      } else {
        productData.productType = [];
      }
    } else {
      productData.productType = [];
    }

    // Get shop's active subscription to check limits
    const shopSubscription = await ShopSubscription.findOne({
      shop: productData.shop,
      status: 'active'
    }).populate('subscriptionPlan');

    if (shopSubscription) {
      // Check max products limit - count only active AND approved products
      const maxProductsLimit = await SubscriptionPlanLimit.findOne({
        subscriptionPlan: shopSubscription.subscriptionPlan._id,
        limitKey: 'max_products'
      });

      if (maxProductsLimit && maxProductsLimit.limitValue !== -1) {
        const productCount = await Product.countDocuments({
          shop: productData.shop,
          isActive: true,
          isApproved: true
        });

        // Check if adding this new product would exceed the limit
        if (productCount >= maxProductsLimit.limitValue) {
          return res.status(400).json({
            message: 'You reach max number of products to be active based on shop subscription plan'
          });
        }
      }

      // Check max hot offers limit if setting as hot offer - count only active AND approved hot offers
      if (productData.isHotOffer) {
        const maxHotOffersLimit = await SubscriptionPlanLimit.findOne({
          subscriptionPlan: shopSubscription.subscriptionPlan._id,
          limitKey: 'max_hot_offers'
        });

        if (maxHotOffersLimit && maxHotOffersLimit.limitValue !== -1) {
          const hotOfferCount = await Product.countDocuments({
            shop: productData.shop,
            isHotOffer: true,
            isActive: true,
            isApproved: true
          });

          // Check if adding this new hot offer would exceed the limit
          if (hotOfferCount >= maxHotOffersLimit.limitValue) {
            return res.status(400).json({
              message: 'You reach max number of hot offers for this shop subscription plan'
            });
          }
        }
      }
    }

    const product = await Product.create(productData);
    await product.populate('shop category');

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    // If user is shopAdmin, ensure they can only update their shop's products
    if (req.user && req.user.role?.name === 'shopAdmin' && req.user.shop) {
      const existingProduct = await Product.findById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (existingProduct.shop.toString() !== req.user.shop.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only update products from your shop.' });
      }
      // Ensure shopAdmin cannot change the shop
      if (req.body.shop && req.body.shop !== req.user.shop.toString()) {
        return res.status(403).json({ message: 'Access denied. You cannot change the shop for this product.' });
      }
    }
    // If user is mallAdmin, ensure they can only update products from shops they created
    else if (req.user && req.user.role?.name === 'mallAdmin') {
      const existingProduct = await Product.findById(req.params.id).populate('shop');
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const shop = await Shop.findById(existingProduct.shop._id || existingProduct.shop);
      if (!shop || shop.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only update products from shops you created.' });
      }
      // Ensure mallAdmin cannot change the shop to one they didn't create
      if (req.body.shop) {
        const newShop = await Shop.findById(req.body.shop);
        if (!newShop || newShop.createdBy.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied. You cannot change the shop to one you did not create.' });
        }
      }
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    // Validate required fields if they are being updated
    const validationErrors = [];
    
    // Only validate if the field is provided in the update
    if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
      validationErrors.push('Product name is required');
    }
    
    if (updateData.description !== undefined && (!updateData.description || !updateData.description.trim())) {
      validationErrors.push('Product description is required');
    }
    
    if (updateData.price !== undefined) {
      const priceValue = parseFloat(updateData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        validationErrors.push('Product price must be greater than 0');
      }
    }
    
    if (updateData.shop !== undefined && !updateData.shop) {
      validationErrors.push('Shop is required');
    }
    
    if (updateData.category !== undefined && !updateData.category) {
      validationErrors.push('Category is required');
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: validationErrors.join('. ')
      });
    }

    // Convert priority to number if provided
    if (updateData.priority !== undefined) {
      updateData.priority = parseInt(updateData.priority) || 0;
    }

    // Convert price to number if provided
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price) || 0;
    }

  // Convert shipping fees to number if provided
  if (updateData.shippingFees !== undefined) {
    updateData.shippingFees = parseFloat(updateData.shippingFees) || 0;
  }

    // Handle averageRating - validate and convert to number if provided
    if (updateData.averageRating !== undefined && updateData.averageRating !== '' && updateData.averageRating !== null) {
      const rating = parseFloat(updateData.averageRating);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        updateData.averageRating = rating;
        // Set totalReviews to 1 if rating is manually set and totalReviews not provided
        // Note: We'll check existing product's totalReviews after fetching it below
        if (!updateData.totalReviews) {
          updateData.totalReviews = 1;
        }
      } else {
        return res.status(400).json({ message: 'Rating must be a number between 0 and 5' });
      }
    } else if (updateData.averageRating === '' || updateData.averageRating === null) {
      // If explicitly set to empty/null, remove it (will use default)
      delete updateData.averageRating;
    }

    // Convert boolean fields
    if (updateData.isHotOffer !== undefined) {
      updateData.isHotOffer = updateData.isHotOffer === 'true' || updateData.isHotOffer === true;
    }

    // Handle productType - can be JSON string, array, or comma-separated string
    if (updateData.productType !== undefined) {
      if (typeof updateData.productType === 'string') {
        // Try parsing as JSON first
        try {
          const parsed = JSON.parse(updateData.productType);
          updateData.productType = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch {
          // If not valid JSON, check if it's comma-separated or single value
          if (updateData.productType.includes(',')) {
            updateData.productType = updateData.productType.split(',').map(t => t.trim()).filter(t => t);
          } else if (updateData.productType.trim()) {
            updateData.productType = [updateData.productType.trim()];
          } else {
            updateData.productType = [];
          }
        }
      } else if (Array.isArray(updateData.productType)) {
        // Already an array, just filter out empty values
        updateData.productType = updateData.productType.filter(t => t && t.trim());
      } else {
        updateData.productType = [];
      }
    }

    if (req.file) {
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    // Get the product to check shop and current hot offer status
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate image - required if being removed and no existing image
    // Check if image is being explicitly set to empty/removed (req.body.image === '' or updateData.image === '')
    // and there's no new file being uploaded and no existing image
    if ((req.body.image === '' || (updateData.image === '' && !req.file)) && !product.image) {
      const validationErrors = [];
      validationErrors.push('Product image is required');
      return res.status(400).json({ 
        message: validationErrors.join('. ')
      });
    }

    // Check hot offer limit if setting to hot offer - count only active AND approved hot offers
    if (updateData.isHotOffer && !product.isHotOffer) {
      // Get shop's active subscription to check limits
      const shopSubscription = await ShopSubscription.findOne({
        shop: product.shop,
        status: 'active'
      }).populate('subscriptionPlan');

      if (shopSubscription) {
        const maxHotOffersLimit = await SubscriptionPlanLimit.findOne({
          subscriptionPlan: shopSubscription.subscriptionPlan._id,
          limitKey: 'max_hot_offers'
        });

        if (maxHotOffersLimit && maxHotOffersLimit.limitValue !== -1) {
          const hotOfferCount = await Product.countDocuments({
            shop: product.shop,
            isHotOffer: true,
            isActive: true,
            isApproved: true
          });

          // Check if adding this hot offer would exceed the limit
          if (hotOfferCount >= maxHotOffersLimit.limitValue) {
            return res.status(400).json({
              message: 'You reach max number of hot offers for this shop subscription plan'
            });
          }
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('shop category');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    // If user is shopAdmin, ensure they can only delete their shop's products
    if (req.user && req.user.role?.name === 'shopAdmin' && req.user.shop) {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.shop.toString() !== req.user.shop.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only delete products from your shop.' });
      }
    }
    // If user is mallAdmin, ensure they can only delete products from shops they created
    else if (req.user && req.user.role?.name === 'mallAdmin') {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const shop = await Shop.findById(product.shop);
      if (!shop || shop.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only delete products from shops you created.' });
      }
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Activate product
exports.activateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = true;
    product.isApproved = true;
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();
    product.updatedBy = req.user._id;

    if (req.body.imageQualityComment) {
      product.imageQualityComment = req.body.imageQualityComment;
    }

    await product.save();
    await product.populate('shop category');

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate product
exports.deactivateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = false;
    product.updatedBy = req.user._id;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product limits status for a shop
exports.getProductLimitsStatus = async (req, res) => {
  try {
    let shopId = req.query.shopId;
    
    // If shopAdmin, use their shop
    if (req.user && req.user.role?.name === 'shopAdmin' && req.user.shop) {
      shopId = req.user.shop.toString();
    }

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    // Get shop's active subscription
    const shopSubscription = await ShopSubscription.findOne({
      shop: shopId,
      status: 'active'
    }).populate('subscriptionPlan');

    if (!shopSubscription) {
      // No subscription means no limits
      return res.json({
        canCreateProduct: true,
        canSetHotOffer: true,
        maxProducts: null,
        maxHotOffers: null,
        currentProducts: 0,
        currentHotOffers: 0
      });
    }

    // Get limits
    const [maxProductsLimit, maxHotOffersLimit] = await Promise.all([
      SubscriptionPlanLimit.findOne({
        subscriptionPlan: shopSubscription.subscriptionPlan._id,
        limitKey: 'max_products'
      }),
      SubscriptionPlanLimit.findOne({
        subscriptionPlan: shopSubscription.subscriptionPlan._id,
        limitKey: 'max_hot_offers'
      })
    ]);

    // Count current active and approved products
    const [productCount, hotOfferCount] = await Promise.all([
      Product.countDocuments({
        shop: shopId,
        isActive: true,
        isApproved: true
      }),
      Product.countDocuments({
        shop: shopId,
        isHotOffer: true,
        isActive: true,
        isApproved: true
      })
    ]);

    const maxProducts = maxProductsLimit && maxProductsLimit.limitValue !== -1 ? maxProductsLimit.limitValue : null;
    const maxHotOffers = maxHotOffersLimit && maxHotOffersLimit.limitValue !== -1 ? maxHotOffersLimit.limitValue : null;

    const canCreateProduct = maxProducts === null || productCount < maxProducts;
    const canSetHotOffer = maxHotOffers === null || hotOfferCount < maxHotOffers;

    res.json({
      canCreateProduct,
      canSetHotOffer,
      maxProducts,
      maxHotOffers,
      currentProducts: productCount,
      currentHotOffers: hotOfferCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

