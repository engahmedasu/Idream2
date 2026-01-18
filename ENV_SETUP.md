# Environment Variables Setup Guide

This guide explains how to configure environment variables for the iDream platform.

> **📚 New: Environment Files Guide**  
> We now support separate `.env.dev` and `.env.prod` files for development and production environments.  
> See **[ENV_FILES_GUIDE.md](./ENV_FILES_GUIDE.md)** for detailed instructions on using environment-specific files.

## 📁 Files Overview



### Template Files

- `backend/.env.dev.example` - Backend development environment template
- `backend/.env.prod.example` - Backend production environment template
- `frontend-portal/.env.dev.example` - Frontend portal development environment template
- `frontend-portal/.env.prod.example` - Frontend portal production environment template
- `admin-portal/.env.dev.example` - Admin portal development environment template
- `admin-portal/.env.prod.example` - Admin portal production environment template

### Recommended Setup

For better environment management, use separate files:
- **`.env.dev`** - Development environment configuration
- **`.env.prod`** - Production environment configuration

See [ENV_FILES_GUIDE.md](./ENV_FILES_GUIDE.md) for setup instructions.

## 🚀 Quick Setup

### Step 1: Create .env files

#### Option A: Using Separate Dev/Prod Files (Recommended)

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

#### Option B: Using Single .env File (Not Recommended)

If you prefer a single environment file, you can copy either dev or prod example:

```bash
# Backend - for development
cd backend
cp .env.dev.example .env

# Frontend Portal - for development
cd ../frontend-portal
cp .env.dev.example .env

# Admin Portal - for development
cd ../admin-portal
cp .env.dev.example .env
```

> **Note:** Using separate `.env.dev` and `.env.prod` files is strongly recommended for better environment management.

### Step 2: Configure each .env file

Edit each `.env.dev` and `.env.prod` file (or `.env` if using legacy approach) with your environment-specific values (see details below).

> **Note:** For detailed instructions on using environment-specific files, see [ENV_FILES_GUIDE.md](./ENV_FILES_GUIDE.md).

## 🔧 Configuration Details

### Backend (.env)

#### Required Variables

1. **NODE_ENV**
   - Set to `production` for production environment
   - Options: `development`, `production`, `test`

2. **PORT**
   - Port number for the backend API server
   - Default: `5000`
   - Example: `5000` or `8080`

3. **MONGODB_URI**
   - MongoDB connection string
   - **Local**: `mongodb://localhost:27017/idream`
   - **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - **Important**: Use a secure, managed database service in production

4. **JWT_SECRET**
   - Secret key for JWT token signing
   - **CRITICAL**: Must be a strong, random string (minimum 32 characters)
   - Generate secure key:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Never use the default value in production!

5. **JWT_EXPIRE**
   - JWT token expiration time
   - Format: `7d` (7 days), `24h` (24 hours), `3600` (seconds)
   - Default: `7d`

#### Email Configuration (Optional but Recommended)

6. **EMAIL_HOST**
   - SMTP server hostname
   - Zoho (US/Global): `smtp.zoho.com`
   - Zoho (Europe): `smtp.zoho.eu`
   - Zoho (India): `smtp.zoho.in`
   - Zoho (Australia): `smtp.zoho.com.au`
   - Mailgun: `smtp.mailgun.org`
   - SendGrid: `smtp.sendgrid.net`
   - Default: `smtp.zoho.com`

7. **EMAIL_PORT**
   - SMTP server port
   - TLS: `587` (recommended)
   - SSL: `465`
   - Default: `587`

8. **EMAIL_USER**
   - SMTP account username (usually full email address)
   - Example: `yourname@zoho.com`, `yourname@zoho.eu`, `yourname@zoho.in`

9. **EMAIL_PASS**
   - SMTP account password
   - **For Zoho**: Use your Zoho account password or App Password (if 2FA is enabled)
   - If 2FA is enabled, generate App Password from Zoho Account settings

### Frontend Portal (.env)

1. **REACT_APP_API_URL**
   - Backend API URL
   - Development: `http://localhost:5000/api`
   - Production: `https://api.yourdomain.com/api`
   - **Important**: Must include `/api` suffix

2. **REACT_APP_ADMIN_PORTAL_URL**
   - Admin portal URL (used for enterprise portal links)
   - Development: `http://localhost:3001`
   - Production: `https://admin.yourdomain.com`

### Admin Portal (.env)

1. **REACT_APP_API_URL**
   - Backend API URL
   - Development: `http://localhost:5000/api`
   - Production: `https://api.yourdomain.com/api`
   - **Important**: Must include `/api` suffix

## 🔒 Security Best Practices

### 1. Never Commit .env Files
- Add `.env` to `.gitignore` (should already be there)
- Only commit `.env.dev.example` and `.env.prod.example` files
- Use environment variables in CI/CD systems

### 2. Use Strong Secrets
- Generate random strings for `JWT_SECRET`
- Use password managers for sensitive values
- Rotate secrets periodically

### 3. Database Security
- Use MongoDB Atlas or managed database service
- Enable authentication and authorization
- Use connection string with credentials (not in code)
- Enable IP whitelisting

### 4. HTTPS in Production
- Use HTTPS for all API endpoints
- Configure reverse proxy (nginx/Apache) with SSL
- Use Let's Encrypt for free SSL certificates

### 5. Email Configuration
- Use Zoho email for notifications (smtp.zoho.com or regional variant)
- Enable 2FA on email accounts
- Consider using dedicated email service (SendGrid, Mailgun)

## 📋 Production Checklist

- [ ] Copy `.env.dev.example` to `.env.dev` and `.env.prod.example` to `.env.prod` in all three directories
- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure production MongoDB URI (MongoDB Atlas recommended)
- [ ] Generate and set strong `JWT_SECRET`
- [ ] Configure SMTP email settings
- [ ] Set production API URLs in frontend and admin portals
- [ ] Verify all `.env` files are in `.gitignore`
- [ ] Test email sending: `npm run test-email` (in backend)
- [ ] Test database connection
- [ ] Set up reverse proxy with SSL certificate
- [ ] Configure CORS for production domains
- [ ] Set up file upload directory permissions

## 🧪 Testing Configuration

### Test Backend Environment
```bash
cd backend
node scripts/testEmail.js  # Test email configuration
npm run seed               # Seed database (development only)
```

### Test Database Connection
```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected'); process.exit(0); }).catch(e => { console.error('❌ Error:', e.message); process.exit(1); });"
```

## 🚀 Deployment Examples

### Example Production URLs

**Backend API:**
```
https://api.idreamegypt.com
https://api.idreamegypt.com/api
```

**Frontend Portal:**
```
https://mall.idreamegypt.com
https://idreamegypt.com
```

**Admin Portal:**
```
https://admin.idreamegypt.com
https://portal.idreamegypt.com
```

### Example .env Files for Production

**backend/.env:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/idream?retryWrites=true&w=majority
JWT_SECRET=<generated-64-character-random-string>
JWT_EXPIRE=7d
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USER=noreply@zoho.com
EMAIL_PASS=<zoho-password>
```

**frontend-portal/.env:**
```env
REACT_APP_API_URL=https://api.idreamegypt.com/api
REACT_APP_ADMIN_PORTAL_URL=https://admin.idreamegypt.com
```

**admin-portal/.env:**
```env
REACT_APP_API_URL=https://api.idreamegypt.com/api
```

## 📝 Notes

- Environment variables in React must start with `REACT_APP_` to be accessible
- Changes to `.env` files require restarting the development server
- Production builds embed environment variables at build time
- Use different `.env` files for different environments (staging, production)
- Consider using environment variable management tools in production (AWS Secrets Manager, Azure Key Vault, etc.)

