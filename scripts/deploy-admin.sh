#!/bin/bash

# iDream Admin Portal Deployment Script
# This script automates the admin portal build and deployment

set -e  # Exit on error

echo "=========================================="
echo "iDream Admin Portal Deployment Script"
echo "=========================================="

ADMIN_DIR="/var/www/idream/admin-portal"

# Check if directory exists
if [ ! -d "$ADMIN_DIR" ]; then
    echo "Error: Admin portal directory not found at $ADMIN_DIR"
    exit 1
fi

cd "$ADMIN_DIR"

echo "Step 1: Installing dependencies..."
npm install

echo "Step 2: Checking environment file..."
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Please edit .env file with your production values"
    else
        echo "Error: .env.example not found"
        exit 1
    fi
fi

echo "Step 3: Building production bundle..."
npm run build

echo "Step 4: Setting permissions..."
chmod -R 755 build

echo "Step 5: Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "Admin portal deployment completed!"
echo "Build output: $ADMIN_DIR/build"
echo "=========================================="

