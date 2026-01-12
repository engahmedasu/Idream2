const Shop = require('../models/Shop');
const Product = require('../models/Product');
const ShareLog = require('../models/ShareLog');
const OrderLog = require('../models/OrderLog');
const SubscriptionLog = require('../models/SubscriptionLog');
const ExcelJS = require('exceljs');

// Generate shops report
exports.generateShopsReport = async (req, res) => {
  try {
    const { fromDate, toDate, format = 'json' } = req.query;

    const filter = {};
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const shops = await Shop.find(filter)
      .populate('category', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      const data = shops.map(shop => ({
        'Shop Name': shop.name,
        'Email': shop.email,
        'Mobile': shop.mobile,
        'WhatsApp': shop.whatsapp,
        'Instagram': shop.instagram || '',
        'Facebook': shop.facebook || '',
        'Address': shop.address,
        'Category': shop.category?.name || '',
        'Is Active': shop.isActive ? 'Yes' : 'No',
        'Is Approved': shop.isApproved ? 'Yes' : 'No',
        'Approved By': shop.approvedBy?.email || '',
        'Approved At': shop.approvedAt || '',
        'Created By': shop.createdBy?.email || '',
        'Created At': shop.createdAt,
        'Updated By': shop.updatedBy?.email || '',
        'Updated At': shop.updatedAt
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Shops');

      // Handle empty data case
      if (!data || data.length === 0) {
        worksheet.addRow(['No data available']);
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=shops-report-${Date.now()}.xlsx`);
        return res.send(buffer);
      }

      // Add headers
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(headers.map(header => row[header] || ''));
      });

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=shops-report-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      res.json({ shops, total: shops.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate products report
exports.generateProductsReport = async (req, res) => {
  try {
    const { fromDate, toDate, format = 'json' } = req.query;

    const filter = {};
    
    // If user is shopAdmin, restrict to their shop only
    if (req.user && req.user.role?.name === 'shopAdmin' && req.user.shop) {
      filter.shop = req.user.shop;
    }
    // If user is mallAdmin, restrict to products from shops they created
    else if (req.user && req.user.role?.name === 'mallAdmin') {
      const Shop = require('../models/Shop');
      const userShops = await Shop.find({ createdBy: req.user._id }).select('_id');
      const shopIds = userShops.map(s => s._id);
      if (shopIds.length > 0) {
        filter.shop = { $in: shopIds };
      } else {
        // If mallAdmin has no shops, return empty array
        filter.shop = { $in: [] };
      }
    }
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const products = await Product.find(filter)
      .populate('shop', 'name email')
      .populate('category', 'name')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      const data = products.map(product => ({
        'Product Name': product.name,
        'Description': product.description,
        'Price': product.price,
        'Shipping Fees': product.shippingFees || 0,
        'Is Hot Offer': product.isHotOffer ? 'Yes' : 'No',
        'Priority': product.priority,
        'Shop Name': product.shop?.name || '',
        'Shop Email': product.shop?.email || '',
        'Category': product.category?.name || '',
        'Shipping Title': product.shippingTitle || '',
        'Shipping Description': product.shippingDescription || '',
        'Warranty Title': product.warrantyTitle || '',
        'Warranty Description': product.warrantyDescription || '',
        'Is Active': product.isActive ? 'Yes' : 'No',
        'Is Approved': product.isApproved ? 'Yes' : 'No',
        'Approved By': product.approvedBy?.email || '',
        'Approved At': product.approvedAt || '',
        'Image Quality Comment': product.imageQualityComment || '',
        'Created By': product.createdBy?.email || '',
        'Created At': product.createdAt,
        'Updated By': product.updatedBy?.email || '',
        'Updated At': product.updatedAt
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      // Handle empty data case
      if (!data || data.length === 0) {
        worksheet.addRow(['No data available']);
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=products-report-${Date.now()}.xlsx`);
        return res.send(buffer);
      }

      // Add headers
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(headers.map(header => row[header] || ''));
      });

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=products-report-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      res.json({ products, total: products.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate share logs report
exports.generateShareReport = async (req, res) => {
  try {
    const { fromDate, toDate, format = 'json' } = req.query;

    const filter = {};
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const logs = await ShareLog.find(filter)
      .populate('product', 'name price')
      .populate('shop', 'name')
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      const data = logs.map(log => ({
        Type: log.type,
        'Product Name': log.product ? log.product.name : '',
        'Product Price': log.product ? log.product.price : '',
        'Shop Name': log.shop ? log.shop.name : '',
        'Item Name (snapshot)': log.itemName || '',
        'User Email': log.user?.email || log.userEmail || '',
        Channel: log.channel || '',
        IP: log.ip || '',
        'User Agent': log.userAgent || '',
        'Shared At': log.createdAt
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Shares');

      // Handle empty data case
      if (!data || data.length === 0) {
        worksheet.addRow(['No data available']);
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=shares-report-${Date.now()}.xlsx`);
        return res.send(buffer);
      }

      // Add headers
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(headers.map(header => row[header] || ''));
      });

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=shares-report-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      res.json({ logs, total: logs.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate order logs report
exports.generateOrderReport = async (req, res) => {
  try {
    const { fromDate, toDate, format = 'json' } = req.query;

    const filter = {};
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const logs = await OrderLog.find(filter)
      .populate('user', 'email phone')
      .populate('shop', 'name email whatsapp')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      // Flatten the data - one row per item in each order
      const data = [];
      logs.forEach(log => {
        log.items.forEach((item, index) => {
          data.push({
            'Order Number': log.orderNumber || log._id.toString().slice(-8).toUpperCase(),
            'Order Date': log.createdAt,
            'Order Time': new Date(log.createdAt).toLocaleTimeString(),
            'User Email': log.user?.email || log.userEmail || '',
            'User Phone': log.user?.phone || '',
            'Shop Name': log.shop?.name || log.shopName || '',
            'Shop Email': log.shop?.email || '',
            'Shop WhatsApp': log.shop?.whatsapp || '',
            'Product Name': item.product?.name || item.productName || '',
            'Quantity': item.quantity,
            'Unit Price': item.price,
            'Shipping Fees': item.shippingFees,
            'Item Total': (item.price + item.shippingFees) * item.quantity,
            'Order Total': log.totalAmount,
            'Channel': log.channel || 'whatsapp',
            'IP Address': log.ip || '',
            'User Agent': log.userAgent || ''
          });
        });
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders');

      // Handle empty data case
      if (!data || data.length === 0) {
        worksheet.addRow(['No data available']);
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=orders-report-${Date.now()}.xlsx`);
        return res.send(buffer);
      }

      // Add headers
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(headers.map(header => row[header] || ''));
      });

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=orders-report-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      res.json({ logs, total: logs.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate subscription logs report (SuperAdmin only)
exports.generateSubscriptionLogsReport = async (req, res) => {
  try {
    const { fromDate, toDate, shopId, action, format = 'json' } = req.query;

    const filter = {};
    
    // Date filtering
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999); // Include the entire end date
        filter.createdAt.$lte = toDateObj;
      }
    }
    
    // Shop filtering
    if (shopId) {
      filter.shop = shopId;
    }
    
    // Action filtering
    if (action) {
      filter.action = action;
    }

    const logs = await SubscriptionLog.find(filter)
      .populate('shop', 'name email')
      .populate('subscriptionPlan', 'displayName')
      .populate('billingCycle', 'name displayName durationInDays')
      .populate('previousSubscriptionPlan', 'displayName')
      .populate('previousBillingCycle', 'name displayName')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    if (format === 'excel') {
      const data = logs.map(log => ({
        'Date': log.createdAt,
        'Action': log.action,
        'Shop Name': log.shop?.name || log.shopName || '',
        'Shop Email': log.shop?.email || '',
        'Subscription Plan': log.subscriptionPlan?.displayName || log.subscriptionPlanName || '',
        'Billing Cycle': log.billingCycle?.displayName || log.billingCycle?.name || log.billingCycleName || '',
        'Duration (Days)': log.billingCycle?.durationInDays || '',
        'Start Date': log.startDate,
        'End Date': log.endDate,
        'Status': log.status,
        'Previous Plan': log.previousSubscriptionPlan?.displayName || log.previousSubscriptionPlanName || 'N/A',
        'Previous Billing Cycle': log.previousBillingCycle?.displayName || log.previousBillingCycle?.name || log.previousBillingCycleName || 'N/A',
        'Created By': log.createdBy?.email || log.createdByEmail || '',
        'Notes': log.notes || ''
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Subscription Logs');

      // Handle empty data case
      if (!data || data.length === 0) {
        worksheet.addRow(['No data available']);
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=subscription-logs-report-${Date.now()}.xlsx`);
        return res.send(buffer);
      }

      // Add headers
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(headers.map(header => row[header] || ''));
      });

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=subscription-logs-report-${Date.now()}.xlsx`);
      res.send(buffer);
    } else {
      res.json({ logs, total: logs.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


