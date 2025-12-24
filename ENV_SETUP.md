# Environment Variables Setup Guide

This guide explains how to configure environment variables for the iDream platform in production.

## 📁 Files Overview

- `backend/.env.example` - Backend API environment variables template
- `frontend-portal/.env.example` - Frontend portal environment variables template
- `admin-portal/.env.example` - Admin portal environment variables template

## 🚀 Quick Setup

### Step 1: Create .env files

Copy the example files to create your .env files:

```bash
# Backend
cd backend
cp .env.example .env

# Frontend Portal
cd ../frontend-portal
cp .env.example .env

# Admin Portal
cd ../admin-portal
cp .env.example .env
```

### Step 2: Configure each .env file

Edit each `.env` file with your production values (see details below).

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
   - Gmail: `smtp.gmail.com`
   - Mailgun: `smtp.mailgun.org`
   - SendGrid: `smtp.sendgrid.net`
   - Default: `smtp.gmail.com`

7. **EMAIL_PORT**
   - SMTP server port
   - TLS: `587`
   - SSL: `465`
   - Default: `587`

8. **EMAIL_USER**
   - SMTP account username (usually full email address)
   - Example: `yourname@gmail.com`

9. **EMAIL_PASS**
   - SMTP account password
   - **For Gmail**: Use an App Password (not your regular password)
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Requires 2-Factor Authentication to be enabled

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
- Only commit `.env.example` files
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
- Use app-specific passwords for Gmail
- Enable 2FA on email accounts
- Consider using dedicated email service (SendGrid, Mailgun)

## 📋 Production Checklist

- [ ] Copy `.env.example` to `.env` in all three directories
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
https://api.idream.com
https://api.idream.com/api
```

**Frontend Portal:**
```
https://www.idream.com
https://idream.com
```

**Admin Portal:**
```
https://admin.idream.com
https://portal.idream.com
```

### Example .env Files for Production

**backend/.env:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/idream?retryWrites=true&w=majority
JWT_SECRET=<generated-64-character-random-string>
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@idream.com
EMAIL_PASS=<gmail-app-password>
```

**frontend-portal/.env:**
```env
REACT_APP_API_URL=https://api.idream.com/api
REACT_APP_ADMIN_PORTAL_URL=https://admin.idream.com
```

**admin-portal/.env:**
```env
REACT_APP_API_URL=https://api.idream.com/api
```

## 📝 Notes

- Environment variables in React must start with `REACT_APP_` to be accessible
- Changes to `.env` files require restarting the development server
- Production builds embed environment variables at build time
- Use different `.env` files for different environments (staging, production)
- Consider using environment variable management tools in production (AWS Secrets Manager, Azure Key Vault, etc.)

