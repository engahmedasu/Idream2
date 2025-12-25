#!/bin/bash

# iDream Backend Deployment Script
# This script automates the backend deployment process

set -e  # Exit on error

echo "=========================================="
echo "iDream Backend Deployment Script"
echo "=========================================="

BACKEND_DIR="/var/www/idream/backend"
NODE_ENV=${NODE_ENV:-production}

# Check if directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

echo "Step 1: Installing dependencies..."
npm install --production

echo "Step 2: Checking environment file..."
if [ ! -f .env.prod ]; then
    echo "Warning: .env.prod file not found. Please create it from .env.prod.example"
    echo "Run: cp .env.prod.example .env.prod && nano .env.prod"
    exit 1
fi

echo "Step 3: Creating uploads directories..."
mkdir -p uploads/categories uploads/products uploads/shops uploads/videos/thumbnails
chmod -R 755 uploads

echo "Step 4: Starting/restarting backend with PM2..."
if pm2 list | grep -q "idream-backend"; then
    echo "Restarting existing idream-backend process..."
    pm2 restart idream-backend
else
    echo "Starting new idream-backend process..."
    pm2 start server.js --name idream-backend
    pm2 save
fi

echo "Step 5: Checking backend status..."
sleep 2
pm2 status idream-backend

echo ""
echo "=========================================="
echo "Backend deployment completed!"
echo "View logs: pm2 logs idream-backend"
echo "=========================================="

