const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper: populate products with shop info (name + whatsapp)
const populateCartProducts = async (cart) => {
  if (!cart) return cart;
  await cart.populate({
    path: 'items.product',
    select: 'name price shippingFees image isActive shop',
    populate: {
      path: 'shop',
      select: 'name whatsapp',
    },
  });
  return cart;
};

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    await populateCartProducts(cart);

    // Filter out inactive products
    cart.items = cart.items.filter(item => item.product && item.product.isActive);

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({ product: productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    await populateCartProducts(cart);

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find item by string comparison to avoid ObjectId cast errors
    const itemIndex = cart.items.findIndex(
      (item) => item._id && item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const item = cart.items[itemIndex];

    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = parseInt(quantity);
    }

    await cart.save();
    await populateCartProducts(cart);

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    // If no cart yet, just return an empty cart object instead of error
    if (!cart) {
      return res.json({ user: req.user._id, items: [] });
    }

    // Find item by string comparison to avoid ObjectId cast errors
    const itemIndex = cart.items.findIndex(
      (item) => item._id && item._id.toString() === itemId
    );

    // If item doesn't exist, return current cart without failing
    if (itemIndex === -1) {
      await populateCartProducts(cart);
      return res.json(cart);
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await populateCartProducts(cart);

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    // If no cart yet, make this a no-op but still succeed
    if (!cart) {
      return res.json({ message: 'Cart cleared successfully', cart: { user: req.user._id, items: [] } });
    }

    cart.items = [];
    await cart.save();
    await populateCartProducts(cart);

    res.json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

