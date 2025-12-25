# Deployment Quick Start Guide

This is a condensed version of the full deployment guide. For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 🚀 Quick Deployment Steps

### Prerequisites
- Ubuntu 20.04/22.04 LTS server
- Domain names pointing to server IP
- SSH access with sudo privileges

### 1. Initial Server Setup (One-time)

```bash
# Run the setup script (installs Node.js, MongoDB, Nginx, PM2, Certbot)
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh

# Or manually:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs mongodb-org nginx certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Create Application Directories

```bash
sudo mkdir -p /var/www/idream/{backend,frontend-portal,admin-portal}
sudo adduser idream --disabled-password --gecos ""
sudo chown -R idream:idream /var/www/idream
```

### 3. Upload Application Code

```bash
# Option 1: Clone from Git
cd /var/www/idream
git clone <your-repo-url> temp
cp -r temp/backend/* backend/
cp -r temp/frontend-portal/* frontend-portal/
cp -r temp/admin-portal/* admin-portal/
rm -rf temp

# Option 2: Upload via SCP (from local machine)
# scp -r backend/* idream@server:/var/www/idream/backend/
# scp -r frontend-portal/* idream@server:/var/www/idream/frontend-portal/
# scp -r admin-portal/* idream@server:/var/www/idream/admin-portal/
```

### 4. Configure Environment Variables

```bash
# Backend
cd /var/www/idream/backend
cp env.prod.example .env.prod
nano .env  # Edit with your values

# Frontend Portal
cd /var/www/idream/frontend-portal
cp env.prod.example .env.prod
nano .env  # Set REACT_APP_API_URL and REACT_APP_ADMIN_PORTAL_URL

# Admin Portal
cd /var/www/idream/admin-portal
cp env.prod.example .env.prod
nano .env  # Set REACT_APP_API_URL
```

### 5. Setup MongoDB

**Option A: Local MongoDB**
```bash
mongosh
use idream
db.createUser({
  user: "idream_admin",
  pwd: "secure-password",
  roles: [{role: "readWrite", db: "idream"}]
})
exit

# Enable authentication
sudo nano /etc/mongod.conf  # Add: security: authorization: enabled
sudo systemctl restart mongod
```

**Option B: MongoDB Atlas**
- Create cluster at https://www.mongodb.com/cloud/atlas
- Get connection string
- Use in backend/.env as MONGODB_URI

### 6. Deploy Backend

```bash
cd /var/www/idream/backend
npm install --production
mkdir -p uploads/{categories,products,shops,videos/thumbnails}
npm run seed  # Initialize database
npm run init-videos  # Initialize videos collection

# Start with PM2
pm2 start server.js --name idream-backend
pm2 startup  # Follow instructions
pm2 save
```

### 7. Build and Deploy Frontend Applications

```bash
# Frontend Portal
cd /var/www/idream/frontend-portal
npm install
npm run build

# Admin Portal
cd /var/www/idream/admin-portal
npm install
npm run build
```

### 8. Configure Nginx

```bash
# Copy configs from nginx-configs/ directory
sudo cp nginx-configs/idream-backend.conf /etc/nginx/sites-available/
sudo cp nginx-configs/idream-frontend.conf /etc/nginx/sites-available/
sudo cp nginx-configs/idream-admin.conf /etc/nginx/sites-available/

# Update server_name in each config file
sudo nano /etc/nginx/sites-available/idream-backend.conf  # Change api.yourdomain.com
sudo nano /etc/nginx/sites-available/idream-frontend.conf  # Change www.yourdomain.com
sudo nano /etc/nginx/sites-available/idream-admin.conf  # Change admin.yourdomain.com

# Enable sites
sudo ln -s /etc/nginx/sites-available/idream-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/idream-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/idream-admin /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Setup SSL (HTTPS)

```bash
# Get SSL certificates
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d www.yourdomain.com -d yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com

# Certbot automatically configures HTTPS and redirects
```

### 10. Configure Firewall

```bash
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 11. Test Deployment

```bash
# Test backend
curl https://api.yourdomain.com/api/health

# Test frontend
# Open browser: https://www.yourdomain.com

# Test admin
# Open browser: https://admin.yourdomain.com
```

## 🔄 Using Deployment Scripts

For automated deployment:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy everything
./scripts/deploy-all.sh

# Or deploy individually
./scripts/deploy-backend.sh
./scripts/deploy-frontend.sh
./scripts/deploy-admin.sh
```

## 📝 Important Notes

1. **Domain Setup**: Ensure DNS A records point to your server IP:
   - `api.yourdomain.com` → Server IP
   - `www.yourdomain.com` → Server IP
   - `admin.yourdomain.com` → Server IP

2. **Environment Variables**: Never commit `.env` files to Git

3. **Security**: 
   - Use strong passwords
   - Generate secure JWT_SECRET
   - Enable MongoDB authentication
   - Keep system updated

4. **Backups**: Set up database backups (see `scripts/backup-database.sh`)

## 🔧 Common Commands

```bash
# Backend
pm2 restart idream-backend
pm2 logs idream-backend
pm2 status

# Nginx
sudo systemctl reload nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# MongoDB
sudo systemctl status mongod
mongosh "mongodb://idream_admin:password@localhost:27017/idream"

# SSL
sudo certbot certificates
sudo certbot renew --dry-run
```

## 📚 Full Documentation

For detailed instructions, troubleshooting, and advanced configuration, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables setup
- [scripts/README.md](./scripts/README.md) - Deployment scripts documentation

