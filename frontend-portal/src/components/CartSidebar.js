import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiX, FiMinus, FiPlus, FiMessageCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './CartSidebar.css';

const CartSidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { cart, updateCartItem, removeFromCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId) => {
    await removeFromCart(itemId);
    toast.success(t('common.success'));
  };

  const handleWhatsAppOrderForShop = async (shopGroup) => {
    if (!user) {
      toast.error(t('cart.loginRequired'));
      navigate('/login');
      return;
    }

    if (!shopGroup || !shopGroup.items || shopGroup.items.length === 0) {
      return;
    }

    const shopWhatsApp = shopGroup.shopWhatsApp;
    if (!shopWhatsApp) {
      toast.error(t('common.error'));
      return;
    }

    const itemsText = shopGroup.items
      .map((item) => {
        const price = item.product.price || 0;
        const shipping = item.product.shippingFees || 0;
        const lineTotal = (price + shipping) * item.quantity;
        return `${item.product.name} x${item.quantity} - EGP ${lineTotal}`;
      })
      .join('\n');

    const message = `Hello! I would like to place an order from ${shopGroup.shopName}:\n\n${itemsText}\n\nTotal: EGP ${shopGroup.total}`;
    const whatsappUrl = `https://wa.me/${shopWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

    // Log the order (fire-and-forget)
    try {
      const orderItems = shopGroup.items.map((item) => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price || 0,
        shippingFees: item.product.shippingFees || 0
      }));

      await api.post('/orders/log', {
        shopId: shopGroup.shopId,
        items: orderItems,
        totalAmount: shopGroup.total
      });
    } catch (err) {
      console.error('Failed to log order', err);
      // Don't block the user from opening WhatsApp if logging fails
    }

    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  const total = getCartTotal();

  // Group items by shop so each shop has its own section and WhatsApp button
  const itemsByShop = {};
  if (cart && cart.items && cart.items.length > 0) {
    cart.items.forEach((item) => {
      const shop = item.product?.shop;
      const shopId = shop?._id || 'unknown';
      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = {
          shopId,
          shopName: shop?.name || 'iDream Tech Hub',
          shopWhatsApp: shop?.whatsapp || '',
          items: [],
          total: 0,
        };
      }

      const price = item.product.price || 0;
      const shipping = item.product.shippingFees || 0;
      const lineTotal = (price + shipping) * item.quantity;

      itemsByShop[shopId].items.push(item);
      itemsByShop[shopId].total += lineTotal;
    });
  }

  const shopGroups = Object.values(itemsByShop);

  return (
    <div className="cart-sidebar-overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>{t('cart.shoppingCart')} {cart?.items?.length || 0}</h2>
          <button className="cart-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {!user && (
          <div className="guest-user-section">
            <p>{t('cart.guestUser')}</p>
            <div className="auth-links">
              <Link to="/login" onClick={onClose}>{t('cart.login')}</Link>
              <span> / </span>
              <Link to="/register" onClick={onClose}>{t('cart.register')}</Link>
            </div>
          </div>
        )}

        {!cart || !cart.items || cart.items.length === 0 ? (
          <div className="cart-items">
            <div className="empty-cart-message">
              <p>{t('cart.emptyCart')}</p>
            </div>
          </div>
        ) : (
          <>
            {shopGroups.map((group) => (
              <div key={group.shopId} className="cart-shop-section">
                <div className="cart-store">
                  <p>{group.shopName}</p>
                </div>
                <div className="cart-items">
                  {group.items.map((item) => (
                    <div key={item._id} className="cart-item">
                      <div className="cart-item-image">
                        <img
                          src={`http://localhost:5000${item.product.image}`}
                          alt={item.product.name}
                        />
                      </div>
                      <div className="cart-item-details">
                        <h4 className="cart-item-name">{item.product.name}</h4>
                        <div className="cart-item-pricing-info">
                          <span className="cart-item-price-label">
                            Price: EGP {item.product.price?.toFixed(2) || '0.00'}
                          </span>
                          {(item.product.shippingFees ?? 0) > 0 && (
                            <span className="cart-item-shipping-label">
                              Shipping Fees: EGP {item.product.shippingFees.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="cart-item-controls">
                          <div className="quantity-controls">
                            <button
                              onClick={() =>
                                handleQuantityChange(item._id, item.quantity - 1)
                              }
                            >
                              <FiMinus />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() =>
                                handleQuantityChange(item._id, item.quantity + 1)
                              }
                            >
                              <FiPlus />
                            </button>
                          </div>
                          <div className="cart-item-price">
                            {(() => {
                              const price = item.product.price || 0;
                              const shipping = item.product.shippingFees || 0;
                              const lineTotal = (price + shipping) * item.quantity;
                              return `EGP ${lineTotal.toFixed(2)}`;
                            })()}
                          </div>
                        </div>
                        <button
                          className="remove-link"
                          onClick={() => handleRemove(item._id)}
                        >
                          {t('cart.remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer shop-footer">
                  <div className="cart-total">
                    <span>{t('cart.total')}:</span>
                    <span className="total-amount">EGP {group.total}</span>
                  </div>
                  <button
                    className="btn-whatsapp-order"
                    onClick={() => handleWhatsAppOrderForShop(group)}
                  >
                    <FiMessageCircle />
                    {t('cart.orderViaWhatsApp')}
                  </button>
                </div>
              </div>
            ))}

            {cart && cart.items && cart.items.length > 0 && (
              <div className="cart-footer overall-footer">
                <div className="cart-total">
                  <span>{t('cart.total')}:</span>
                  <span className="total-amount">EGP {total}</span>
                </div>
                {!user && (
                  <p className="login-note">{t('cart.loginRequired')}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
