# iDream Platform - Complete Deployment Guide for Linux Servers

This guide provides step-by-step instructions for deploying the iDream platform on Linux servers with HTTPS.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Step 1: System Setup](#step-1-system-setup)
4. [Step 2: Install Software Dependencies](#step-2-install-software-dependencies)
5. [Step 3: Database Setup (MongoDB)](#step-3-database-setup-mongodb)
6. [Step 4: Backend Deployment](#step-4-backend-deployment)
7. [Step 5: Frontend Portal Deployment](#step-5-frontend-portal-deployment)
8. [Step 6: Admin Portal Deployment](#step-6-admin-portal-deployment)
9. [Step 7: Nginx Reverse Proxy Setup](#step-7-nginx-reverse-proxy-setup)
10. [Step 8: SSL Certificate Setup (HTTPS)](#step-8-ssl-certificate-setup-https)
11. [Step 9: Process Management with PM2](#step-9-process-management-with-pm2)
12. [Step 10: Firewall Configuration](#step-10-firewall-configuration)
13. [Step 11: Testing & Going Live](#step-11-testing--going-live)
14. [Maintenance & Updates](#maintenance--updates)
15. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A Linux server (Ubuntu 20.04/22.04 LTS recommended)
- Root or sudo access
- Domain name(s) pointing to your server IP
- Basic knowledge of Linux command line
- SSH access to the server

---

## Server Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04/22.04 LTS or similar

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

---

## Step 1: System Setup

### 1.1 Update System

```bash
# Update package list
sudo apt update
sudo apt upgrade -y

# Install essential utilities
sudo apt install -y curl wget git build-essential
```

### 1.2 Create Application User

```bash
# Create a non-root user for running the application
sudo adduser idream --disabled-password --gecos ""
sudo usermod -aG sudo idream

# Switch to the application user
su - idream
```

### 1.3 Create Application Directory Structure

```bash
# Create application directories
sudo mkdir -p /var/www/idream
sudo mkdir -p /var/www/idream/backend
sudo mkdir -p /var/www/idream/frontend-portal
sudo mkdir -p /var/www/idream/admin-portal

# Set ownership
sudo chown -R idream:idream /var/www/idream
```

---

## Step 2: Install Software Dependencies

### 2.1 Install Node.js (using NodeSource repository)

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### 2.2 Install MongoDB

#### Option A: MongoDB Community Edition (Self-hosted)

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# For Ubuntu 20.04, use:
# echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### Option B: MongoDB Atlas (Cloud - Recommended for Production)

If using MongoDB Atlas, skip the MongoDB installation and use the connection string from Atlas dashboard. You'll configure it in the backend `.env` file.

### 2.3 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 2.4 Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the instructions provided by the command above
```

### 2.5 Install Certbot (for SSL certificates)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Step 3: Database Setup (MongoDB)

### 3.1 If Using Local MongoDB

```bash
# Access MongoDB shell
mongosh

# Create database and user
use idream

db.createUser({
  user: "idream_admin",
  pwd: "your-secure-password-here",
  roles: [
    { role: "readWrite", db: "idream" },
    { role: "dbAdmin", db: "idream" }
  ]
})

# Exit MongoDB shell
exit
```

### 3.2 Configure MongoDB Security (Local Installation)

```bash
# Edit MongoDB configuration
sudo nano /etc/mongod.conf

# Enable authentication (uncomment or add):
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### 3.3 If Using MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Whitelist your server IP address
5. Get connection string from Atlas dashboard

---

## Step 4: Backend Deployment

### 4.1 Clone/Upload Backend Code

```bash
cd /var/www/idream

# Option 1: Clone from Git repository
git clone <your-repository-url> temp-repo
cp -r temp-repo/backend/* /var/www/idream/backend/
rm -rf temp-repo

# Option 2: Upload via SCP from your local machine
# On local machine: scp -r backend/* idream@your-server:/var/www/idream/backend/
```

### 4.2 Install Backend Dependencies

```bash
cd /var/www/idream/backend

# Install dependencies
npm install --production
```

### 4.3 Configure Backend Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Configure the following in `.env`:

```env
NODE_ENV=production
PORT=5000

# For Local MongoDB
MONGODB_URI=mongodb://idream_admin:your-secure-password@localhost:27017/idream?authSource=idream

# For MongoDB Atlas (replace with your connection string)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/idream?retryWrites=true&w=majority

# Generate a secure JWT secret
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-generated-secret-here>
JWT_EXPIRE=7d

# Email configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4.4 Initialize Database

```bash
# Seed the database (run once)
npm run seed

# Initialize videos collection
npm run init-videos
```

### 4.5 Create Uploads Directory

```bash
# Create uploads directory structure
mkdir -p uploads/categories
mkdir -p uploads/products
mkdir -p uploads/shops
mkdir -p uploads/videos/thumbnails

# Set proper permissions
chmod -R 755 uploads
```

### 4.6 Test Backend

```bash
# Start backend manually to test
node server.js

# If successful, stop with Ctrl+C
```

### 4.7 Setup PM2 for Backend

```bash
# Start backend with PM2
cd /var/www/idream/backend
pm2 start server.js --name idream-backend

# Save PM2 process list
pm2 save

# View logs
pm2 logs idream-backend
```

---

## Step 5: Frontend Portal Deployment

### 5.1 Clone/Upload Frontend Code

```bash
cd /var/www/idream

# Option 1: Clone from Git repository
git clone <your-repository-url> temp-repo
cp -r temp-repo/frontend-portal/* /var/www/idream/frontend-portal/
rm -rf temp-repo

# Option 2: Upload via SCP
# On local machine: scp -r frontend-portal/* idream@your-server:/var/www/idream/frontend-portal/
```

### 5.2 Configure Frontend Environment

```bash
cd /var/www/idream/frontend-portal

# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Configure:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_ADMIN_PORTAL_URL=https://admin.yourdomain.com
```

### 5.3 Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the 'build' directory
```

### 5.4 Set Permissions

```bash
# Set proper permissions
sudo chown -R idream:idream /var/www/idream/frontend-portal/build
chmod -R 755 /var/www/idream/frontend-portal/build
```

---

## Step 6: Admin Portal Deployment

### 6.1 Clone/Upload Admin Portal Code

```bash
cd /var/www/idream

# Option 1: Clone from Git repository
git clone <your-repository-url> temp-repo
cp -r temp-repo/admin-portal/* /var/www/idream/admin-portal/
rm -rf temp-repo

# Option 2: Upload via SCP
# On local machine: scp -r admin-portal/* idream@your-server:/var/www/idream/admin-portal/
```

### 6.2 Configure Admin Portal Environment

```bash
cd /var/www/idream/admin-portal

# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Configure:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### 6.3 Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in the 'build' directory
```

### 6.4 Set Permissions

```bash
# Set proper permissions
sudo chown -R idream:idream /var/www/idream/admin-portal/build
chmod -R 755 /var/www/idream/admin-portal/build
```

---

## Step 7: Nginx Reverse Proxy Setup

### 7.1 Create Nginx Configuration for Backend API

```bash
sudo nano /etc/nginx/sites-available/idream-backend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS (will be configured after SSL)
    # For now, comment this out until SSL is set up
    # return 301 https://$server_name$request_uri;

    # Location for API
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit (for videos and images)
    client_max_body_size 100M;
}backe
```

### 7.2 Create Nginx Configuration for Frontend Portal

```bash
sudo nano /etc/nginx/sites-available/idream-frontend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name www.yourdomain.com yourdomain.com;

    # Redirect HTTP to HTTPS (will be configured after SSL)
    # return 301 https://$server_name$request_uri;

    root /var/www/idream/frontend-portal/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 7.3 Create Nginx Configuration for Admin Portal

```bash
sudo nano /etc/nginx/sites-available/idream-admin
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    # Redirect HTTP to HTTPS (will be configured after SSL)
    # return 301 https://$server_name$request_uri;

    root /var/www/idream/admin-portal/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 7.4 Enable Nginx Sites

```bash
# Create symbolic links to enable sites
sudo ln -s /etc/nginx/sites-available/idream-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/idream-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/idream-admin /etc/nginx/sites-enabled/

# Remove default Nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 8: SSL Certificate Setup (HTTPS)

### 8.1 Install SSL Certificates with Certbot

```bash
# Obtain SSL certificate for backend API
sudo certbot --nginx -d api.yourdomain.com

# Obtain SSL certificate for frontend portal
sudo certbot --nginx -d www.yourdomain.com -d yourdomain.com

# Obtain SSL certificate for admin portal
sudo certbot --nginx -d admin.yourdomain.com
```

Certbot will automatically:
- Obtain certificates from Let's Encrypt
- Configure Nginx with SSL
- Set up automatic renewal

### 8.2 Enable HTTPS Redirect in Nginx Configs

After SSL is installed, Certbot will have updated the configs. Verify the configs include HTTPS redirects.

### 8.3 Test SSL Certificate Renewal

```bash
# Test automatic renewal
sudo certbot renew --dry-run
```

### 8.4 Update Backend CORS Settings

**Important**: Update CORS in `backend/server.js` to restrict access to your production domains:

```bash
nano /var/www/idream/backend/server.js
```

Find the line:
```javascript
app.use(cors());
```

Replace with:
```javascript
// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://www.yourdomain.com', 'https://yourdomain.com', 'https://admin.yourdomain.com'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Alternatively, you can add `ALLOWED_ORIGINS` to your `.env` file:
```env
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com,https://admin.yourdomain.com
```

Then update server.js to use:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
```

Restart backend:
```bash
pm2 restart idream-backend
```

---

## Step 9: Process Management with PM2

### 9.1 Configure PM2 Ecosystem (Optional but Recommended)

Create PM2 ecosystem file:

```bash
cd /var/www/idream/backend
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'idream-backend',
    script: 'server.js',
    instances: 2, // Number of CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Create logs directory:
```bash
mkdir -p logs
```

Restart with ecosystem:
```bash
pm2 delete idream-backend
pm2 start ecosystem.config.js
pm2 save
```

### 9.2 Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs idream-backend

# Monitor processes
pm2 monit

# Restart backend
pm2 restart idream-backend

# Stop backend
pm2 stop idream-backend

# Delete process
pm2 delete idream-backend
```

---

## Step 10: Firewall Configuration

### 10.1 Configure UFW Firewall

```bash
# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

**Important**: Only allow port 22 if you have SSH access configured, otherwise you may lock yourself out!

---

## Step 11: Testing & Going Live

### 11.1 Test Backend API

```bash
# Test health endpoint
curl https://api.yourdomain.com/api/health

# Test with authentication (if needed)
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@idream.com","password":"P@ssw0rd123"}'
```

### 11.2 Test Frontend Portal

1. Open browser: `https://www.yourdomain.com`
2. Verify homepage loads
3. Test navigation
4. Test API calls

### 11.3 Test Admin Portal

1. Open browser: `https://admin.yourdomain.com`
2. Login with superadmin credentials
3. Test dashboard and features

### 11.4 Final Checklist

- [ ] All services are running (PM2, MongoDB, Nginx)
- [ ] SSL certificates are installed and valid
- [ ] Frontend connects to backend API
- [ ] Admin portal connects to backend API
- [ ] Database is seeded with initial data
- [ ] File uploads directory has proper permissions
- [ ] Firewall is configured correctly
- [ ] Logs are being generated correctly
- [ ] Backups are configured (recommended)

---

## Maintenance & Updates

### Update Application Code

```bash
# 1. Backup current deployment
sudo cp -r /var/www/idream /var/www/idream.backup.$(date +%Y%m%d)

# 2. Pull/upload new code
cd /var/www/idream/backend
# Update code (git pull or upload new files)

# 3. Install new dependencies
npm install --production

# 4. Restart backend
pm2 restart idream-backend

# 5. For frontend/admin portal
cd /var/www/idream/frontend-portal
npm install
npm run build
sudo systemctl reload nginx

cd /var/www/idream/admin-portal
npm install
npm run build
sudo systemctl reload nginx
```

### Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-idream-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/idream"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Local MongoDB backup
mongodump --uri="mongodb://idream_admin:password@localhost:27017/idream" --out=$BACKUP_DIR/$DATE

# For MongoDB Atlas, use:
# mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/idream" --out=$BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$DATE.tar.gz"
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup-idream-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-idream-db.sh
```

### Monitor Logs

```bash
# Backend logs
pm2 logs idream-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs idream-backend --lines 50

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check environment variables
cd /var/www/idream/backend
cat .env
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb://idream_admin:password@localhost:27017/idream"

# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check certificate expiration
sudo certbot certificates | grep Expiry
```

### File Upload Issues

```bash
# Check directory permissions
ls -la /var/www/idream/backend/uploads

# Fix permissions if needed
sudo chown -R idream:idream /var/www/idream/backend/uploads
chmod -R 755 /var/www/idream/backend/uploads

# Check Nginx client_max_body_size setting
sudo grep client_max_body_size /etc/nginx/sites-available/idream-backend
```

---

## Security Recommendations

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Strong Passwords**
   - Database passwords
   - JWT secrets
   - Email passwords

3. **Regular Backups**
   - Database backups
   - Application code backups
   - Configuration backups

4. **Monitor Logs**
   - Set up log rotation
   - Monitor for errors
   - Watch for security issues

5. **Firewall Rules**
   - Only allow necessary ports
   - Use fail2ban for SSH protection

6. **SSL/TLS**
   - Keep certificates renewed
   - Use strong cipher suites
   - Enable HSTS headers

---

## Quick Reference Commands

```bash
# Restart all services
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart mongod

# View all logs
pm2 logs
sudo journalctl -u nginx -f
sudo tail -f /var/log/nginx/error.log

# Check service status
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# Backup database
/usr/local/bin/backup-idream-db.sh

# Update application
cd /var/www/idream/backend && npm install --production && pm2 restart idream-backend
```

---

## Support

For issues or questions:
1. Check logs first
2. Review this deployment guide
3. Check application README
4. Review error messages carefully

---

**Congratulations! Your iDream platform should now be live and accessible via HTTPS!** 🎉

