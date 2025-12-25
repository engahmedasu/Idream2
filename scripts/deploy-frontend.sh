#!/bin/bash

# iDream Frontend Portal Deployment Script
# This script automates the frontend portal build and deployment

set -e  # Exit on error

echo "=========================================="
echo "iDream Frontend Portal Deployment Script"
echo "=========================================="

FRONTEND_DIR="/var/www/idream/frontend-portal"

# Check if directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

echo "Step 1: Installing dependencies..."
npm install

echo "Step 2: Checking environment file..."
if [ ! -f .env.prod ]; then
    echo "Warning: .env.prod file not found. Creating from .env.prod.example..."
    if [ -f .env.prod.example ]; then
        cp .env.prod.example .env.prod
        echo "Please edit .env.prod file with your production values"
    else
        echo "Error: .env.prod.example not found"
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
echo "Frontend portal deployment completed!"
echo "Build output: $FRONTEND_DIR/build"
echo "=========================================="

