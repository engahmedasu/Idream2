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

    const logData = {
      user: user._id,
      userEmail: user.email || userEmail || '',
      shop: shopId,
      shopName: shop.name,
      items: orderItems,
      totalAmount: totalAmount || orderItems.reduce((sum, item) => sum + (item.price + item.shippingFees) * item.quantity, 0),
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

