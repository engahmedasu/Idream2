#!/bin/bash

# iDream Initial Server Setup Script
# Run this script once on a fresh Ubuntu server to install all dependencies

set -e  # Exit on error

echo "=========================================="
echo "iDream Server Setup Script"
echo "=========================================="
echo ""
echo "This script will install:"
echo "  - Node.js 18.x"
echo "  - MongoDB"
echo "  - Nginx"
echo "  - PM2"
echo "  - Certbot"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
echo "Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install essential utilities
echo "Step 2: Installing essential utilities..."
sudo apt install -y curl wget git build-essential

# Install Node.js
echo "Step 3: Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install MongoDB
echo "Step 4: Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Detect Ubuntu version
UBUNTU_VERSION=$(lsb_release -rs)
if [[ $UBUNTU_VERSION == "22.04" ]]; then
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
elif [[ $UBUNTU_VERSION == "20.04" ]]; then
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
else
    echo "Warning: Unsupported Ubuntu version. Please install MongoDB manually."
fi

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

echo "MongoDB status:"
sudo systemctl status mongod --no-pager

# Install Nginx
echo "Step 5: Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "Nginx status:"
sudo systemctl status nginx --no-pager

# Install PM2
echo "Step 6: Installing PM2..."
sudo npm install -g pm2

# Install Certbot
echo "Step 7: Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directories
echo "Step 8: Creating application directories..."
sudo mkdir -p /var/www/idream/{backend,frontend-portal,admin-portal}
sudo mkdir -p /var/backups/idream

# Create application user if it doesn't exist
if ! id "idream" &>/dev/null; then
    echo "Step 9: Creating application user..."
    sudo adduser idream --disabled-password --gecos ""
    sudo usermod -aG sudo idream
else
    echo "Step 9: Application user 'idream' already exists"
fi

# Set ownership
sudo chown -R idream:idream /var/www/idream
sudo chown -R idream:idream /var/backups/idream

echo ""
echo "=========================================="
echo "Server setup completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Upload your application code to /var/www/idream/"
echo "2. Configure .env files in each directory"
echo "3. Run deployment scripts or follow DEPLOYMENT_GUIDE.md"
echo "4. Setup MongoDB (create database and user)"
echo "5. Configure Nginx (see DEPLOYMENT_GUIDE.md)"
echo "6. Setup SSL certificates with Certbot"
echo "=========================================="

