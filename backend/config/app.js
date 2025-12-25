/**
 * Application Configuration
 * Centralized configuration management for backend
 * Supports development and production environments
 */

const path = require('path');
const fs = require('fs');

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENV_FILE = process.env.ENV_FILE;
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

// Load environment variables
const envFile = ENV_FILE || 
  (isProduction ? '.env.prod' : 
   isDevelopment ? '.env.dev' : '.env');

const envPath = path.join(__dirname, '..', envFile);

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log(`📝 Loading environment from: ${envFile}`);
} else {
  require('dotenv').config();
  if (envFile !== '.env') {
    console.log(`⚠️  ${envFile} not found, using default .env`);
  }
}

/**
 * Application Configuration Object
 */
const config = {
  // Environment
  env: {
    NODE_ENV,
    isProduction,
    isDevelopment,
    isTest: NODE_ENV === 'test',
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: '/api',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/idream',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: 'HS256',
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@idream.com',
  },

  // CORS Configuration
  cors: {
    origin: isProduction 
      ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://idream.com'])
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB for images
    maxVideoSize: 100 * 1024 * 1024, // 100MB for videos
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
    uploadDir: path.join(__dirname, '..', 'uploads'),
  },

  // Logging Configuration
  logging: {
    level: isProduction ? 'error' : 'debug',
    format: isProduction ? 'json' : 'pretty',
    enableConsole: !isProduction,
  },

  // Security Configuration
  security: {
    bcryptRounds: 10,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: isProduction ? 100 : 1000, // requests per window
  },

  // Swagger/API Documentation
  swagger: {
    enabled: !isProduction,
    path: '/api-docs',
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    { key: 'database.uri', value: config.database.uri },
    { key: 'jwt.secret', value: config.jwt.secret },
  ];

  const missing = required.filter(item => !item.value || item.value === '');
  
  if (missing.length > 0 && isProduction) {
    console.error('❌ Missing required configuration:', missing.map(m => m.key).join(', '));
    process.exit(1);
  } else if (missing.length > 0) {
    console.warn('⚠️  Missing configuration (will use defaults):', missing.map(m => m.key).join(', '));
  }
};

validateConfig();

module.exports = config;

