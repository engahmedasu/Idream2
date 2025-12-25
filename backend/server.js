const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Suppress DEP0060 deprecation warning (util._extend) from dependencies
// This warning comes from older dependencies that haven't been updated yet
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.code === 'DEP0060') {
    // Suppress util._extend deprecation warning - it's from a dependency, not our code
    return;
  }
  // Show other warnings normally
  console.warn(warning.name, warning.message);
});

// Load environment variables based on ENV_FILE or NODE_ENV
// Supports: .env.dev, .env.prod, or default .env
const fs = require('fs');
const envFile = process.env.ENV_FILE || 
  (process.env.NODE_ENV === 'production' ? '.env.prod' : 
   process.env.NODE_ENV === 'development' ? '.env.dev' : '.env');

const envPath = path.join(__dirname, envFile);

// Check if the specified env file exists, otherwise fallback to .env
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`📝 Loading environment from: ${envFile}`);
} else {
  // Fallback to default .env if specified file doesn't exist
  dotenv.config();
  if (envFile !== '.env') {
    console.log(`⚠️  ${envFile} not found, using default .env`);
  } else {
    console.log(`📝 Loading environment from: .env`);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection - Wait for connection before starting server
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idream', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    return true;
  } catch (err) {
    console.error('\n❌ MongoDB connection error:');
    console.error(`   ${err.message}`);
    console.error('\n   To fix this:');
    console.error('   1. Make sure MongoDB is installed and running');
    console.error('   2. Start MongoDB service: net start MongoDB (as Administrator)');
    console.error('   3. Or start MongoDB manually: mongod');
    console.error('   4. Or use MongoDB Atlas (cloud) and set MONGODB_URI in .env\n');
    return false;
  }
};

// Middleware to check MongoDB connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database connection not available. Please ensure MongoDB is running.',
      error: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
};

// Routes (protected with DB connection check)
app.use('/api/auth', checkDBConnection, require('./routes/auth'));
app.use('/api/users', checkDBConnection, require('./routes/users'));
app.use('/api/shops', checkDBConnection, require('./routes/shops'));
app.use('/api/products', checkDBConnection, require('./routes/products'));
app.use('/api/categories', checkDBConnection, require('./routes/categories'));
app.use('/api/roles', checkDBConnection, require('./routes/roles'));
app.use('/api/permissions', checkDBConnection, require('./routes/permissions'));
app.use('/api/cart', checkDBConnection, require('./routes/cart'));
app.use('/api/reviews', checkDBConnection, require('./routes/reviews'));
app.use('/api/reports', checkDBConnection, require('./routes/reports'));
app.use('/api/shares', checkDBConnection, require('./routes/shares'));
app.use('/api/orders', checkDBConnection, require('./routes/orders'));
app.use('/api/subscriptions', checkDBConnection, require('./routes/subscriptions'));
app.use('/api/billingcycles', checkDBConnection, require('./routes/billingCycles'));
app.use('/api/videos', checkDBConnection, require('./routes/videos'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'iDream API Documentation'
}));

// Health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: iDream API is running
 */
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    message: 'iDream API is running',
    database: dbStatus
  });
});

// Start server only after MongoDB connection
const startServer = async () => {
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.error('\n⚠️  Server will not start without database connection.');
    console.error('   Please start MongoDB and restart the server.\n');
    process.exit(1);
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.error(`   Another process is using this port.`);
      console.error(`   To fix this:`);
      console.error(`   1. Stop the existing server (Ctrl+C in the terminal where it's running)`);
      console.error(`   2. Or kill the process: taskkill /PID <process_id> /F`);
      console.error(`   3. Or change the PORT in .env file\n`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
};

// Start the application
startServer();

