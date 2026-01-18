import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import getImageUrl from '../utils/imageUrl';
import formatCurrency from '../utils/formatCurrency';
import './Cart.css';

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <h1>Shopping Cart</h1>
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/')}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId) => {
    await removeFromCart(itemId);
    toast.success('Item removed from cart');
  };

  const total = getCartTotal();

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Shopping Cart</h1>
        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-image">
                  <img
                    src={getImageUrl(item.product.image)}
                    alt={item.product.name}
                  />
                </div>
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-shop">{item.product.shop?.name}</p>
                  <div className="cart-item-pricing">
                    <p className="cart-item-price">Price: {formatCurrency(item.product.price?.toFixed(2) || '0.00')}</p>
                    {(item.product.shippingFees ?? 0) > 0 && (
                      <p className="cart-item-shipping">Shipping: {formatCurrency(item.product.shippingFees.toFixed(2))}</p>
                    )}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>
                      <FiMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>
                      <FiPlus />
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className="cart-item-total">
                  {formatCurrency((() => {
                    const price = item.product.price || 0;
                    const shipping = item.product.shippingFees || 0;
                    return ((price + shipping) * item.quantity).toFixed(2);
                  })())}
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(total.toFixed(2))}</span>
            </div>
            <div className="summary-row">
              <span>Total:</span>
              <span className="total-amount">{formatCurrency(total.toFixed(2))}</span>
            </div>
            <button className="checkout-btn">Proceed to Checkout</button>
            <button className="continue-shopping-btn" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

