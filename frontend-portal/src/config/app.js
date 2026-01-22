/**
 * Application Configuration
 * Centralized configuration management for Frontend Portal
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

  // Admin Portal URL
  adminPortal: {
    url: process.env.REACT_APP_ADMIN_PORTAL_URL || 'http://localhost:3001',
  },

  // Application Settings
  app: {
    name: 'iDream Portal',
    version: '1.0.0',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
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
    carousel: {
      autoPlayInterval: 5000, // 5 seconds
      transitionDuration: 500, // milliseconds
    },
  },

  // Performance Configuration
  performance: {
    enableLazyLoading: isProduction,
    enableCodeSplitting: isProduction,
    enableServiceWorker: isProduction,
    cacheStrategy: isProduction ? 'cache-first' : 'network-first',
  },

  // Media Cache Configuration
  cache: {
    // Cache duration in hours (default: 168 hours = 7 days)
    durationHours: parseInt(process.env.REACT_APP_CACHE_DURATION_HOURS || process.env.REACT_APP_MEDIA_CACHE_HOURS || '168', 10),
    // Enable localStorage fallback for small images (< 1MB)
    enableLocalStorageFallback: true,
    // Auto cleanup expired entries on app start
    autoCleanup: true,
  },

  // Development Tools
  devTools: {
    enableReactDevTools: isDevelopment,
    enableReduxDevTools: isDevelopment,
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

