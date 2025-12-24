// Create app instance for testing without starting the server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/shops', require('../routes/shops'));
app.use('/api/products', require('../routes/products'));
app.use('/api/categories', require('../routes/categories'));
app.use('/api/roles', require('../routes/roles'));
app.use('/api/permissions', require('../routes/permissions'));
app.use('/api/cart', require('../routes/cart'));
app.use('/api/reviews', require('../routes/reviews'));
app.use('/api/reports', require('../routes/reports'));
app.use('/api/shares', require('../routes/shares'));
app.use('/api/orders', require('../routes/orders'));
app.use('/api/subscriptions', require('../routes/subscriptions'));
app.use('/api/billingcycles', require('../routes/billingCycles'));

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    message: 'iDream API is running',
    database: dbStatus
  });
});

module.exports = app;

