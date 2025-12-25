# Dual-Build System Migration Guide

This guide explains the new dual-build system with separate development and production configurations, and how to migrate your existing setup.

## 📋 Overview

The project now uses a centralized configuration system that:
- **Separates dev and production configurations** clearly
- **Centralizes all config** in dedicated config files
- **Optimizes builds** for each environment
- **Validates configuration** on startup
- **Provides type-safe access** to configuration values

## 🏗️ Architecture

### Configuration Files Created

1. **Backend**: `backend/config/app.js`
   - Centralized configuration for server, database, JWT, email, CORS, etc.
   - Automatically loads `.env.dev` or `.env.prod` based on `NODE_ENV` and `ENV_FILE`

2. **Frontend Portal**: `frontend-portal/src/config/app.js`
   - Centralized configuration for API URLs, feature flags, UI settings
   - Uses environment variables from `.env.dev` or `.env.prod`

3. **Admin Portal**: `admin-portal/src/config/app.js`
   - Centralized configuration for API URLs, feature flags, UI settings
   - Uses environment variables from `.env.dev` or `.env.prod`

### Build Optimizations

- **Development**: Fast builds with source maps, hot reload, debug tools
- **Production**: Optimized bundles, code splitting, minification, no source maps

## 🔄 Migration Steps

### Step 1: Verify Environment Files

**Important**: The old `.env.example` files have been removed. You should only use `.env.dev.example` and `.env.prod.example` files.

Ensure you have the correct environment files:

```bash
# Backend
backend/.env.dev.example  → Copy to backend/.env.dev
backend/.env.prod.example  → Copy to backend/.env.prod

# Frontend Portal
frontend-portal/.env.dev.example  → Copy to frontend-portal/.env.dev
frontend-portal/.env.prod.example  → Copy to frontend-portal/.env.prod

# Admin Portal
admin-portal/.env.dev.example  → Copy to admin-portal/.env.dev
admin-portal/.env.prod.example  → Copy to admin-portal/.env.prod
```

> **Note**: The generic `.env.example` files are no longer needed. The dual-build system uses separate `.env.dev.example` and `.env.prod.example` templates for better environment separation.

### Step 2: Update Your Code

The following files have been updated to use centralized config:

#### Backend Changes

**Before:**
```javascript
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/idream';
```

**After:**
```javascript
const config = require('./config/app');
const PORT = config.server.port;
const MONGODB_URI = config.database.uri;
```

#### Frontend Portal Changes

**Before:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

**After:**
```javascript
import config from '../config/app';
const API_URL = config.api.baseURL;
```

#### Admin Portal Changes

**Before:**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

**After:**
```javascript
import config from '../config/app';
const API_URL = config.api.baseURL;
```

### Step 3: Update npm Scripts Usage

#### Backend

**Development:**
```bash
npm run dev:dev      # Development with .env.dev
npm run dev:prod     # Production mode with .env.prod (for testing)
npm run start:dev    # Start server in dev mode
npm run start:prod   # Start server in production mode
```

**Production:**
```bash
npm run start:prod   # Recommended for production
# OR
NODE_ENV=production ENV_FILE=.env.prod npm start
```

#### Frontend Portal

**Development:**
```bash
npm run start:dev    # Development server with .env.dev
npm run start:prod   # Production mode with .env.prod (for testing)
```

**Build:**
```bash
npm run build:dev    # Development build
npm run build:prod   # Production build (optimized)
```

#### Admin Portal

**Development:**
```bash
npm run start:dev    # Development server with .env.dev
npm run start:prod   # Production mode with .env.prod (for testing)
```

**Build:**
```bash
npm run build:dev    # Development build
npm run build:prod   # Production build (optimized)
```

## 📝 Configuration Values Migration

### Backend Configuration

All backend configuration is now accessed through `config` object:

| Old Access | New Access | Description |
|-----------|------------|-------------|
| `process.env.PORT` | `config.server.port` | Server port |
| `process.env.MONGODB_URI` | `config.database.uri` | MongoDB connection string |
| `process.env.JWT_SECRET` | `config.jwt.secret` | JWT secret key |
| `process.env.JWT_EXPIRE` | `config.jwt.expiresIn` | JWT expiration |
| `process.env.EMAIL_HOST` | `config.email.host` | Email SMTP host |
| `process.env.EMAIL_PORT` | `config.email.port` | Email SMTP port |
| `process.env.EMAIL_USER` | `config.email.user` | Email username |
| `process.env.EMAIL_PASS` | `config.email.password` | Email password |

### Frontend Portal Configuration

All frontend configuration is now accessed through `config` object:

| Old Access | New Access | Description |
|-----------|------------|-------------|
| `process.env.REACT_APP_API_URL` | `config.api.baseURL` | API base URL |
| `process.env.REACT_APP_ADMIN_PORTAL_URL` | `config.adminPortal.url` | Admin portal URL |
| - | `config.env.isProduction` | Production flag |
| - | `config.env.isDevelopment` | Development flag |
| - | `config.features.enableDebugMode` | Debug mode flag |

### Admin Portal Configuration

All admin portal configuration is now accessed through `config` object:

| Old Access | New Access | Description |
|-----------|------------|-------------|
| `process.env.REACT_APP_API_URL` | `config.api.baseURL` | API base URL |
| - | `config.env.isProduction` | Production flag |
| - | `config.env.isDevelopment` | Development flag |

## 🎯 Benefits

1. **Type Safety**: Centralized config provides better IDE autocomplete
2. **Validation**: Configuration is validated on startup
3. **Environment Separation**: Clear separation between dev and prod
4. **Build Optimizations**: Automatic optimizations for production builds
5. **Maintainability**: Single source of truth for configuration
6. **Documentation**: Config files serve as documentation

## 🔍 Configuration Structure

### Backend Config (`backend/config/app.js`)

```javascript
{
  env: { NODE_ENV, isProduction, isDevelopment, isTest },
  server: { port, host, apiPrefix },
  database: { uri, options },
  jwt: { secret, expiresIn, algorithm },
  email: { host, port, secure, user, password, from },
  cors: { origin, credentials, methods, allowedHeaders },
  upload: { maxFileSize, maxVideoSize, allowedImageTypes, ... },
  logging: { level, format, enableConsole },
  security: { bcryptRounds, rateLimitWindow, rateLimitMax },
  swagger: { enabled, path }
}
```

### Frontend Portal Config (`frontend-portal/src/config/app.js`)

```javascript
{
  env: { NODE_ENV, isProduction, isDevelopment },
  api: { baseURL, timeout, retryAttempts, retryDelay },
  adminPortal: { url },
  app: { name, version, defaultLanguage, supportedLanguages },
  features: { enableAnalytics, enableErrorReporting, ... },
  ui: { theme, pagination, carousel },
  performance: { enableLazyLoading, enableCodeSplitting, ... },
  devTools: { enableReactDevTools, logLevel }
}
```

### Admin Portal Config (`admin-portal/src/config/app.js`)

```javascript
{
  env: { NODE_ENV, isProduction, isDevelopment },
  api: { baseURL, timeout, retryAttempts, retryDelay },
  app: { name, version, port },
  features: { enableAnalytics, enableErrorReporting, ... },
  ui: { theme, pagination, table },
  performance: { enableLazyLoading, enableCodeSplitting, ... },
  devTools: { enableReactDevTools, logLevel }
}
```

## 🚀 Quick Start

### For Development

```bash
# Backend
cd backend
npm run dev:dev

# Frontend Portal
cd frontend-portal
npm run start:dev

# Admin Portal
cd admin-portal
npm run start:dev
```

### For Production

```bash
# Backend
cd backend
npm run start:prod

# Frontend Portal
cd frontend-portal
npm run build:prod
# Deploy the build/ directory

# Admin Portal
cd admin-portal
npm run build:prod
# Deploy the build/ directory
```

## ⚠️ Important Notes

1. **Environment Files**: Always use `.env.dev` for development and `.env.prod` for production
2. **Never Commit**: Never commit `.env.dev` or `.env.prod` files to version control
3. **NODE_ENV**: The build system automatically sets `NODE_ENV` based on the script used
4. **Fallback**: If environment files are missing, the system falls back to defaults (with warnings)
5. **Validation**: Configuration is validated on startup - missing required values will cause errors in production

## 🐛 Troubleshooting

### "Configuration validation failed"

- Check that all required environment variables are set in your `.env.dev` or `.env.prod` file
- Verify the file exists and is in the correct directory

### "Cannot find module '../config/app'"

- Ensure you're importing from the correct path
- Check that the config file exists in the expected location

### Build optimizations not working

- Ensure `NODE_ENV=production` is set (automatically set by `build:prod` scripts)
- Check `craco.config.js` for correct environment detection

## 📚 Additional Resources

- [Environment Files Guide](./ENV_FILES_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Environment Setup](./ENV_SETUP.md)

