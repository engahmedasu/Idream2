# Environment Files Guide

This guide explains how to use separate environment files for development and production environments.

## 📁 Environment Files Structure

Each application (backend, frontend-portal, admin-portal) has separate environment files:

- **`.env.dev`** - Development environment configuration
- **`.env.prod`** - Production environment configuration
- **`.env`** - Default/fallback environment file (optional, not recommended)

### Template Files

Template files are provided as examples:
- `.env.dev.example` - Template for development (copy to `.env.dev`)
- `.env.prod.example` - Template for production (copy to `.env.prod`)

> **Note**: The old generic `.env.example` files have been removed. The dual-build system uses separate dev/prod example files for better environment separation.

## 🚀 Quick Setup

### Step 1: Copy Template Files

Copy the example files to create your actual environment files:

```bash
# Backend
cd backend
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod

# Frontend Portal
cd ../frontend-portal
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod

# Admin Portal
cd ../admin-portal
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod
```

### Step 2: Configure Each File

Edit each `.env.dev` and `.env.prod` file with your environment-specific values.

## 🔧 Usage

### Backend

The backend automatically loads the appropriate env file based on:
1. `ENV_FILE` environment variable (if set)
2. `NODE_ENV` environment variable
3. Falls back to `.env` if the specified file doesn't exist

#### Available Scripts:

```bash
# Development mode (uses .env.dev)
npm run dev:dev

# Production mode (uses .env.prod)
npm run start:prod

# Default (uses .env or auto-detects)
npm start
npm run dev
```

#### Manual Override:

```bash
# Use specific env file
ENV_FILE=.env.dev node server.js
ENV_FILE=.env.prod node server.js
```

### Frontend Portal

Uses `env-cmd` to load specific environment files.

#### Available Scripts:

```bash
# Development mode (uses .env.dev)
npm run start:dev

# Production build (uses .env.prod)
npm run build:prod

# Default (uses .env if exists, or react-scripts defaults)
npm start
npm run build
```

### Admin Portal

Uses `env-cmd` to load specific environment files.

#### Available Scripts:

```bash
# Development mode (uses .env.dev)
npm run start:dev

# Production build (uses .env.prod)
npm run build:prod

# Default (uses .env if exists, or react-scripts defaults)
npm start
npm run build
```

## 📋 Configuration Details

### Backend Environment Variables

#### Development (`.env.dev`):
- `NODE_ENV=development`
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/idream` (local database)
- `JWT_SECRET=dev-secret-key...` (can be simpler for dev)
- Email settings for development testing

#### Production (`.env.prod`):
- `NODE_ENV=production`
- `PORT=5000` (or as configured)
- `MONGODB_URI=mongodb+srv://...` (MongoDB Atlas or managed service)
- `JWT_SECRET=<strong-random-string>` (MUST be secure)
- Production email settings

### Frontend Portal Environment Variables

#### Development (`.env.dev`):
- `REACT_APP_API_URL=http://localhost:5000/api`
- `REACT_APP_ADMIN_PORTAL_URL=http://localhost:3001`

#### Production (`.env.prod`):
- `REACT_APP_API_URL=https://api.yourdomain.com/api`
- `REACT_APP_ADMIN_PORTAL_URL=https://admin.yourdomain.com`

### Admin Portal Environment Variables

#### Development (`.env.dev`):
- `REACT_APP_API_URL=http://localhost:5000/api`

#### Production (`.env.prod`):
- `REACT_APP_API_URL=https://api.yourdomain.com/api`

## 🔒 Security Best Practices

1. **Never Commit Environment Files**
   - `.env.dev` and `.env.prod` are in `.gitignore`
   - Only commit `.env.dev.example` and `.env.prod.example` templates
   - **Note**: The old `.env.example` files have been removed - use the dev/prod example files instead

2. **Use Strong Secrets in Production**
   - Generate secure `JWT_SECRET`: 
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. **Separate Databases**
   - Use different databases for development and production
   - Never use production database for development

4. **Environment-Specific URLs**
   - Use localhost URLs for development
   - Use HTTPS URLs for production

## 🧪 Testing Different Environments

### Test Development Environment:

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

### Test Production Build Locally:

```bash
# Backend
cd backend
npm run start:prod

# Frontend Portal
cd frontend-portal
npm run build:prod
# Then serve the build folder

# Admin Portal
cd admin-portal
npm run build:prod
# Then serve the build folder
```

## 📝 Migration from Single .env File

If you're currently using a single `.env` file:

1. Copy your current `.env` to `.env.dev`:
   ```bash
   cp .env .env.dev
   ```

2. Create `.env.prod` with production values:
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with production values
   ```

3. Update your deployment scripts to use the appropriate env file.

## 🔄 CI/CD Integration

For CI/CD pipelines, you can set environment variables directly or use the `ENV_FILE` variable:

```bash
# In CI/CD pipeline
ENV_FILE=.env.prod npm run build:prod
```

Or set environment variables directly in your CI/CD platform (GitHub Actions, GitLab CI, etc.).

## 📚 Additional Resources

- See `ENV_SETUP.md` for detailed configuration instructions
- See `DEPLOYMENT_GUIDE.md` for production deployment setup

