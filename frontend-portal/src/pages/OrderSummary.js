import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import getImageUrl, { handleImageError } from '../utils/imageUrl';
import './OrderSummary.css';

const OrderSummary = () => {
  const { orderNumber } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        // Fetch order by order number
        const response = await api.get(`/orders/summary/${orderNumber}`);
        setOrderData(response.data);
        
        // Update Open Graph meta tags for WhatsApp preview
        updateMetaTags(response.data);
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrderData();
    }
  }, [orderNumber]);

  const updateMetaTags = (data) => {
    if (!data) return;

    // Get the first product image for the preview (use absolute URL)
    const firstProductImage = data.items && data.items.length > 0 
      ? (data.items[0].product?.image 
          ? getImageUrl(data.items[0].product.image)
          : data.items[0].productImage 
            ? getImageUrl(data.items[0].productImage)
            : '')
      : '';

    const title = `Order #${data.orderNumber} - ${data.shopName || 'iDream Mall'}`;
    const description = `Order from ${data.shopName || 'iDream Mall'}. ${data.items?.length || 0} item(s). Total: ${data.totalAmount || 0} EGP`;
    const url = window.location.href;
    // Use absolute URL for image - ensure it's a full URL
    const imageUrl = firstProductImage 
      ? (firstProductImage.startsWith('http') ? firstProductImage : `${window.location.origin}${firstProductImage}`)
      : `${window.location.origin}/logo.svg`;

    // Helper to update or create meta tags
    const updateMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateMetaTagByName = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Open Graph tags (for WhatsApp, Facebook, etc.)
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'iDream Mall');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', imageUrl);

    // Standard meta tags
    updateMetaTagByName('description', description);

    // Update page title
    document.title = title;
  };

  if (loading) {
    return (
      <div className="order-summary-page">
        <div className="order-summary-container">
          <div className="loading-message">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="order-summary-page">
        <div className="order-summary-container">
          <div className="error-message">Order not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-summary-page">
      <div className="order-summary-container">
        <div className="order-header">
          <h1>Order Summary</h1>
          <div className="order-number">Order # {orderData.orderNumber}</div>
        </div>

        <div className="order-info">
          <div className="info-section">
            <h2>Store Information</h2>
            <p><strong>Store:</strong> {orderData.shopName || 'N/A'}</p>
            {orderData.shopEmail && <p><strong>Email:</strong> {orderData.shopEmail}</p>}
            {orderData.shopWhatsApp && <p><strong>WhatsApp:</strong> {orderData.shopWhatsApp}</p>}
          </div>

          <div className="info-section">
            <h2>Order Details</h2>
            <p><strong>Order Date:</strong> {orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : 'N/A'}</p>
            {orderData.userEmail && <p><strong>Customer Email:</strong> {orderData.userEmail}</p>}
          </div>
        </div>

        <div className="order-items">
          <h2>Order Items</h2>
          {orderData.items && orderData.items.length > 0 ? (
            <div className="items-list">
              {orderData.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    <img
                      src={getImageUrl(item.product?.image || item.productImage || '')}
                      alt={item.product?.name || item.productName || 'Product'}
                      onError={handleImageError}
                    />
                  </div>
                  <div className="item-details">
                    <h3>{item.product?.name || item.productName || 'Product'}</h3>
                    <div className="item-info">
                      <p><strong>Quantity:</strong> {item.quantity}</p>
                      <p><strong>Unit Price:</strong> {item.price} EGP</p>
                      {item.shippingFees > 0 && (
                        <p><strong>Shipping:</strong> {item.shippingFees} EGP</p>
                      )}
                      <p className="item-total">
                        <strong>Total:</strong> {((item.price + (item.shippingFees || 0)) * item.quantity).toFixed(2)} EGP
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No items found</p>
          )}
        </div>

        <div className="order-total">
          <h2>Order Total: {orderData.totalAmount?.toFixed(2) || '0.00'} EGP</h2>
        </div>

        <div className="order-footer">
          <p>Thank you for your order with iDream Mall!</p>
          <p>If you need any assistance, feel free to contact us.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;

