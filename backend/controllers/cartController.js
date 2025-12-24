const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper: populate products with shop info (name + whatsapp)
// Returns a plain object suitable for JSON response
const populateCartProducts = async (cart) => {
  if (!cart) return { items: [] };
  try {
    await cart.populate({
      path: 'items.product',
      select: 'name price shippingFees image isActive shop',
      populate: {
        path: 'shop',
        select: 'name whatsapp',
      },
    });
    
    // Filter out items with null products (deleted products)
    let validItems = [];
    if (cart.items && Array.isArray(cart.items)) {
      validItems = cart.items.filter(item => {
        return item.product !== null && item.product !== undefined;
      });
    }
    
    // Convert to plain object for JSON response
    const cartObj = cart.toObject ? cart.toObject() : { ...cart };
    cartObj.items = validItems;
    return cartObj;
  } catch (error) {
    console.error('Error populating cart products:', error);
    // If population fails, return cart with filtered items
    let validItems = [];
    if (cart.items && Array.isArray(cart.items)) {
      validItems = cart.items.filter(item => {
        return item.product !== null && item.product !== undefined;
      });
    }
    const cartObj = cart.toObject ? cart.toObject() : { ...cart };
    cartObj.items = validItems;
    return cartObj;
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const populatedCart = await populateCartProducts(cart);

    // Filter out inactive products
    populatedCart.items = populatedCart.items.filter(item => item.product && item.product.isActive);

    res.json(populatedCart);
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
    const populatedCart = await populateCartProducts(cart);

    res.json(populatedCart);
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
    const populatedCart = await populateCartProducts(cart);

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log('Remove from cart - itemId:', itemId);
    console.log('Remove from cart - user:', req.user?._id);

    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    // If no cart yet, just return an empty cart object instead of error
    if (!cart) {
      console.log('No cart found for user');
      return res.json({ user: req.user._id, items: [] });
    }

    console.log('Cart found with', cart.items?.length || 0, 'items');

    // Find item by string comparison to avoid ObjectId cast errors
    const itemIndex = cart.items.findIndex(
      (item) => {
        if (!item || !item._id) {
          console.log('Item missing _id:', item);
          return false;
        }
        const matches = item._id.toString() === itemId.toString();
        if (matches) {
          console.log('Found matching item at index:', cart.items.indexOf(item));
        }
        return matches;
      }
    );

    console.log('Item index found:', itemIndex);

    // If item doesn't exist, return current cart without failing
    if (itemIndex === -1) {
      console.log('Item not found in cart, returning current cart');
      await populateCartProducts(cart);
      return res.json(cart);
    }

    // Remove the item using splice (Mongoose will track this change)
    // Using splice instead of pull to avoid pre-save hook issues
    cart.items.splice(itemIndex, 1);
    
    console.log('Item removed, saving cart...');
    
    try {
      await cart.save();
      console.log('Cart saved successfully');
    } catch (saveError) {
      console.error('Error saving cart after removal:', saveError);
      console.error('Save error stack:', saveError.stack);
      return res.status(500).json({ 
        message: 'Failed to save cart after removal',
        error: saveError.message 
      });
    }
    
    // Reload cart from database to get fresh state
    let updatedCart;
    try {
      updatedCart = await Cart.findById(cart._id);
      if (!updatedCart) {
        return res.json({ user: req.user._id, items: [] });
      }
    } catch (findError) {
      console.error('Error finding cart after save:', findError);
      return res.status(500).json({ 
        message: 'Failed to reload cart after removal',
        error: findError.message 
      });
    }
    
    // Populate products on the reloaded cart
    try {
      console.log('Populating cart products...');
      const populatedCart = await populateCartProducts(updatedCart);
      console.log('Cart products populated successfully');
      console.log('Returning updated cart with', populatedCart.items?.length || 0, 'items');
      return res.json(populatedCart);
    } catch (populateError) {
      console.error('Error populating cart after removal:', populateError);
      console.error('Populate error stack:', populateError.stack);
      // Still return the cart even if population fails, but ensure items array exists
      const cartObj = updatedCart.toObject ? updatedCart.toObject() : updatedCart;
      if (!cartObj.items) {
        cartObj.items = [];
      }
      return res.json(cartObj);
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to remove item from cart',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

