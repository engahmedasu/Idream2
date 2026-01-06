/**
 * Application Configuration
 * Centralized configuration management for Admin Portal
 * Supports development and production environments
 */

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Application Configuration Object
 */
const config = {
  // Environment
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
    isProduction,
    isDevelopment,
  },

  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || (isProduction ? 'https://api.idreamegypt.com/api' : 'http://localhost:5000/api'),
    timeout: 30000, // 30 seconds
    retryAttempts: isProduction ? 3 : 1,
    retryDelay: 1000, // 1 second
  },

  // Image Base URL (for serving uploaded images)
  imageBaseURL: process.env.REACT_APP_IMAGE_BASE_URL || (isProduction ? 'https://api.idreamegypt.com' : 'http://localhost:5000'),

  // Application Settings
  app: {
    name: 'iDream Admin Portal',
    version: '1.0.0',
    port: 3001,
  },

  // Feature Flags
  features: {
    enableAnalytics: isProduction,
    enableErrorReporting: isProduction,
    enableDebugMode: !isProduction,
    enableHotReload: isDevelopment,
  },

  // UI Configuration
  ui: {
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
    },
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
    },
    table: {
      defaultPageSize: 10,
      maxPageSize: 50,
    },
  },

  // Performance Configuration
  performance: {
    enableLazyLoading: isProduction,
    enableCodeSplitting: isProduction,
    enableServiceWorker: isProduction,
    cacheStrategy: isProduction ? 'cache-first' : 'network-first',
  },

  // Development Tools
  devTools: {
    enableReactDevTools: isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'error',
  },
};

// Validate configuration
const validateConfig = () => {
  if (!config.api.baseURL) {
    console.warn('⚠️  REACT_APP_API_URL not set, using default:', config.api.baseURL);
  }
};

validateConfig();

export default config;

