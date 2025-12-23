const ShareLog = require('../models/ShareLog');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');

// Log a share action from the frontend portal
exports.logShare = async (req, res) => {
  try {
    const {
      type,          // 'product' or 'shop'
      itemId,        // productId or shopId
      itemName,      // optional fallback name
      channel,       // 'web_share', 'copy_link', etc.
      userId,        // optional, from frontend
      userEmail      // optional, from frontend
    } = req.body;

    if (!type || !itemId) {
      return res.status(400).json({ message: 'type and itemId are required' });
    }

    const logData = {
      type,
      channel: channel || 'unknown',
      ip: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || ''
    };

    // Attach product or shop references and name
    if (type === 'product') {
      logData.product = itemId;
      if (!itemName) {
        const product = await Product.findById(itemId).select('name');
        logData.itemName = product ? product.name : '';
      } else {
        logData.itemName = itemName;
      }
    } else if (type === 'shop') {
      logData.shop = itemId;
      if (!itemName) {
        const shop = await Shop.findById(itemId).select('name');
        logData.itemName = shop ? shop.name : '';
      } else {
        logData.itemName = itemName;
      }
    }

    // Try to attach user info if available from auth middleware
    if (req.user && req.user._id) {
      logData.user = req.user._id;
      if (req.user.email) {
        logData.userEmail = req.user.email;
      }
    } else {
      // Fallback to data from frontend if provided
      if (userId) {
        logData.user = userId;
      }
      if (userEmail) {
        logData.userEmail = userEmail;
      }
    }

    const log = await ShareLog.create(logData);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error logging share:', error);
    res.status(500).json({ message: error.message });
  }
};


