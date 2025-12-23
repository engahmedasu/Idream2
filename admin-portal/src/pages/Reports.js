import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiDownload, FiFileText, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Reports.css';

const Reports = ({ reportType: propReportType }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine report type from prop, URL path, or default to 'products'
  const getReportType = () => {
    if (propReportType) return propReportType;
    const path = location.pathname;
    if (path.includes('/shares')) return 'shares';
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/subscription-logs')) return 'subscription-logs';
    return 'products';
  };
  
  const [reportType, setReportType] = useState(getReportType());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingJson, setLoadingJson] = useState(false);
  const [products, setProducts] = useState([]);
  const [shares, setShares] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscriptionLogs, setSubscriptionLogs] = useState([]);

  // Update report type when URL changes
  useEffect(() => {
    const newReportType = getReportType();
    if (newReportType !== reportType) {
      setReportType(newReportType);
      // Clear all data when switching report types
      setProducts([]);
      setShares([]);
      setOrders([]);
      setSubscriptionLogs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, propReportType]);

  const validateDates = () => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      toast.error('From date cannot be after To date');
      return false;
    }
    return true;
  };

  const buildParams = () => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return params;
  };

  const handleDownloadExcel = async () => {
    if (!validateDates()) return;

    try {
      setLoadingExcel(true);
      const params = { ...buildParams(), format: 'excel' };
      let endpoint = '/reports/products';
      if (reportType === 'shares') endpoint = '/reports/shares';
      else if (reportType === 'orders') endpoint = '/reports/orders';
      else if (reportType === 'subscription-logs') endpoint = '/reports/subscription-logs';

      const response = await api.get(endpoint, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      let prefix = 'products';
      if (reportType === 'shares') prefix = 'shares';
      else if (reportType === 'orders') prefix = 'orders';
      else if (reportType === 'subscription-logs') prefix = 'subscription-logs';
      link.download = `${prefix}-report-${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      let message = 'Products report (Excel) generated successfully';
      if (reportType === 'shares') message = 'Sharing report (Excel) generated successfully';
      else if (reportType === 'orders') message = 'Order report (Excel) generated successfully';
      else if (reportType === 'subscription-logs') message = 'Subscription logs report (Excel) generated successfully';
      toast.success(message);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to generate Excel report');
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleViewJson = async () => {
    if (!validateDates()) return;

    try {
      setLoadingJson(true);
      const params = { ...buildParams(), format: 'json' };
      let endpoint = '/reports/products';
      if (reportType === 'shares') endpoint = '/reports/shares';
      else if (reportType === 'orders') endpoint = '/reports/orders';
      else if (reportType === 'subscription-logs') endpoint = '/reports/subscription-logs';

      const response = await api.get(endpoint, { params });

      if (reportType === 'products') {
        setProducts(response.data.products || []);
      } else if (reportType === 'shares') {
        setShares(response.data.logs || []);
      } else if (reportType === 'orders') {
        setOrders(response.data.logs || []);
      } else if (reportType === 'subscription-logs') {
        setSubscriptionLogs(response.data.logs || []);
      }

      let message = 'Products report loaded';
      if (reportType === 'shares') message = 'Sharing report loaded';
      else if (reportType === 'orders') message = 'Order report loaded';
      else if (reportType === 'subscription-logs') message = 'Subscription logs report loaded';
      toast.success(message);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load products report');
    } finally {
      setLoadingJson(false);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Reports - {reportType === 'products' ? 'Products' : reportType === 'shares' ? 'Sharing' : reportType === 'orders' ? 'Orders' : 'Subscription Logs'}</h2>
        <p className="page-subtitle">
          {reportType === 'products' ? (
            <>
              Generate products report by date range. Report includes all product details plus{' '}
              <strong>Created By / Created At / Updated By / Updated At</strong>.
              {(user?.role?.name === 'shopAdmin' || user?.role === 'shopAdmin') && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Note: You can only view and export products from your shop.
                </span>
              )}
              {(user?.role?.name === 'mallAdmin' || user?.role === 'mallAdmin') && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Note: You can only view and export products from shops you created.
                </span>
              )}
            </>
          ) : reportType === 'shares' ? (
            <>
              See how often products and shops are shared from the frontend portal. Filter by date
              and export all share events.
            </>
          ) : reportType === 'subscription-logs' ? (
            <>
              View all subscription plan changes for shops. Track subscription history including plan changes, billing cycle updates, and status changes.
            </>
          ) : (
            <>
              View all orders placed via WhatsApp from the frontend portal. Includes user details, products, quantities, shops, and order date/time.
            </>
          )}
        </p>
      </div>

      <div className="filters-section">
        <div className="date-filter">
          <label>
            <FiCalendar /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="date-filter">
          <label>
            <FiCalendar /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="actions">
          <button
            className="btn-primary"
            onClick={handleDownloadExcel}
            disabled={loadingExcel}
          >
            <FiDownload />
            {loadingExcel ? 'Generating...' : 'Download Excel'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleViewJson}
            disabled={loadingJson}
          >
            <FiFileText />
            {loadingJson ? 'Loading...' : 'View on Screen'}
          </button>
        </div>
      </div>

      {reportType === 'products' && products.length > 0 && (
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Price</th>
                <th>Shop</th>
                <th>Category</th>
                <th>Hot Offer</th>
                <th>Active</th>
                <th>Approved</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Updated By</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td className="description-cell">{product.description}</td>
                  <td>{product.price}</td>
                  <td>{product.shop?.name || '-'}</td>
                  <td>{product.category?.name || '-'}</td>
                  <td>{product.isHotOffer ? 'Yes' : 'No'}</td>
                  <td>{product.isActive ? 'Yes' : 'No'}</td>
                  <td>{product.isApproved ? 'Yes' : 'No'}</td>
                  <td>{product.createdBy?.email || '-'}</td>
                  <td>{product.createdAt ? new Date(product.createdAt).toLocaleString() : '-'}</td>
                  <td>{product.updatedBy?.email || '-'}</td>
                  <td>{product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'products' && !loadingJson && products.length === 0 && (
        <div className="no-data-message">
          No products found for the selected date range.
        </div>
      )}

      {reportType === 'shares' && shares.length > 0 && (
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Shop</th>
                <th>Item Name (snapshot)</th>
                <th>User Email</th>
                <th>Channel</th>
                <th>Shared At</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((log) => (
                <tr key={log._id}>
                  <td>{log.type}</td>
                  <td>{log.product?.name || '-'}</td>
                  <td>{log.shop?.name || '-'}</td>
                  <td className="description-cell">{log.itemName || '-'}</td>
                  <td>{log.user?.email || log.userEmail || '-'}</td>
                  <td>{log.channel || '-'}</td>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                  <td>{log.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'shares' && !loadingJson && shares.length === 0 && (
        <div className="no-data-message">
          No share actions found for the selected date range.
        </div>
      )}

      {reportType === 'orders' && orders.length > 0 && (
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Order Date</th>
                <th>Order Time</th>
                <th>User Email</th>
                <th>User Phone</th>
                <th>Shop Name</th>
                <th>Shop WhatsApp</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Shipping Fees</th>
                <th>Item Total</th>
                <th>Order Total</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((log) => 
                log.items.map((item, index) => (
                  <tr key={`${log._id}-${index}`}>
                    {index === 0 && (
                      <>
                        <td rowSpan={log.items.length}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td rowSpan={log.items.length}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '-'}
                        </td>
                        <td rowSpan={log.items.length}>
                          {log.user?.email || log.userEmail || '-'}
                        </td>
                        <td rowSpan={log.items.length}>
                          {log.user?.phone || '-'}
                        </td>
                        <td rowSpan={log.items.length}>
                          {log.shop?.name || log.shopName || '-'}
                        </td>
                        <td rowSpan={log.items.length}>
                          {log.shop?.whatsapp || '-'}
                        </td>
                      </>
                    )}
                    <td>{item.product?.name || item.productName || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price}</td>
                    <td>{item.shippingFees || 0}</td>
                    <td>{(item.price + (item.shippingFees || 0)) * item.quantity}</td>
                    {index === 0 && (
                      <td rowSpan={log.items.length}>
                        {log.totalAmount}
                      </td>
                    )}
                    {index === 0 && (
                      <td rowSpan={log.items.length}>
                        {log.channel || 'whatsapp'}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'orders' && !loadingJson && orders.length === 0 && (
        <div className="no-data-message">
          No orders found for the selected date range.
        </div>
      )}

      {reportType === 'subscription-logs' && subscriptionLogs.length > 0 && (
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Shop Name</th>
                <th>Shop Email</th>
                <th>Subscription Plan</th>
                <th>Billing Cycle</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Previous Plan</th>
                <th>Previous Billing Cycle</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionLogs.map((log) => (
                <tr key={log._id}>
                  <td>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                  <td>
                    <span className={`badge badge-${log.action === 'created' ? 'success' : log.action === 'updated' ? 'info' : 'secondary'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.shop?.name || log.shopName || '-'}</td>
                  <td>{log.shop?.email || '-'}</td>
                  <td>{log.subscriptionPlan?.displayName || log.subscriptionPlanName || '-'}</td>
                  <td>{log.billingCycle?.displayName || log.billingCycle?.name || log.billingCycleName || '-'}</td>
                  <td>{log.startDate ? new Date(log.startDate).toLocaleDateString() : '-'}</td>
                  <td>{log.endDate ? new Date(log.endDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`badge badge-${log.status === 'active' ? 'success' : 'danger'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.previousSubscriptionPlan?.displayName || log.previousSubscriptionPlanName || 'N/A'}</td>
                  <td>{log.previousBillingCycle?.displayName || log.previousBillingCycle?.name || log.previousBillingCycleName || 'N/A'}</td>
                  <td>{log.createdBy?.email || log.createdByEmail || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'subscription-logs' && !loadingJson && subscriptionLogs.length === 0 && (
        <div className="no-data-message">
          No subscription logs found for the selected date range.
        </div>
      )}
    </div>
  );
};

export default Reports;

