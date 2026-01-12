const OrderLog = require('../models/OrderLog');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');

// Log an order action (Order via WhatsApp)
exports.logOrder = async (req, res) => {
  try {
    const {
      shopId,
      items, // Array of { productId, quantity, price, shippingFees }
      totalAmount,
      userId,
      userEmail
    } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'shopId and items array are required' });
    }

    // Get user info
    let user = null;
    if (req.user && req.user._id) {
      user = req.user;
    } else if (userId) {
      user = await User.findById(userId).select('email');
    }

    if (!user) {
      return res.status(400).json({ message: 'User information is required' });
    }

    // Get shop info
    const shop = await Shop.findById(shopId).select('name');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Prepare items with product names
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId).select('name');
        return {
          product: item.productId,
          productName: product ? product.name : item.productName || '',
          quantity: item.quantity,
          price: item.price || 0,
          shippingFees: item.shippingFees || 0
        };
      })
    );

    // Generate unique numeric order number using Unix timestamp (milliseconds)
    // If provided from frontend, use it; otherwise generate a new one
    let orderNumber = req.body.orderNumber || (Date.now() + Math.floor(Math.random() * 1000)).toString();
    
    // Ensure uniqueness: if orderNumber already exists, regenerate
    let attempts = 0;
    let existingOrder = null;
    do {
      existingOrder = await OrderLog.findOne({ orderNumber });
      if (existingOrder && attempts < 10) {
        // Regenerate with new timestamp + random component
        orderNumber = (Date.now() + Math.floor(Math.random() * 10000)).toString();
        attempts++;
      } else if (existingOrder) {
        // Fallback: use timestamp with user ID component to ensure uniqueness
        orderNumber = Date.now().toString() + user._id.toString().slice(-6).replace(/\D/g, '');
      }
    } while (existingOrder && attempts < 10);

    const logData = {
      user: user._id,
      userEmail: user.email || userEmail || '',
      shop: shopId,
      shopName: shop.name,
      items: orderItems,
      totalAmount: totalAmount || orderItems.reduce((sum, item) => sum + (item.price + item.shippingFees) * item.quantity, 0),
      orderNumber: orderNumber,
      channel: 'whatsapp',
      ip: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    };

    const log = await OrderLog.create(logData);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error logging order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get order summary by order number (for sharing)
exports.getOrderSummary = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({ message: 'Order number is required' });
    }

    const order = await OrderLog.findOne({ orderNumber })
      .populate('user', 'email phone')
      .populate('shop', 'name email whatsapp')
      .populate('items.product', 'name image price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Format response with all necessary data for the summary page
    const summary = {
      orderNumber: order.orderNumber,
      shopName: order.shop?.name || order.shopName,
      shopEmail: order.shop?.email || '',
      shopWhatsApp: order.shop?.whatsapp || '',
      userEmail: order.user?.email || order.userEmail || '',
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        product: item.product ? {
          _id: item.product._id,
          name: item.product.name,
          image: item.product.image
        } : null,
        productName: item.product?.name || item.productName || '',
        productImage: item.product?.image || '',
        quantity: item.quantity,
        price: item.price,
        shippingFees: item.shippingFees || 0
      }))
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching order summary:', error);
    res.status(500).json({ message: error.message });
  }
};

