#!/bin/bash

# iDream Database Backup Script
# This script creates a backup of the MongoDB database

set -e  # Exit on error

BACKUP_DIR="/var/backups/idream"
DATE=$(date +%Y%m%d_%H%M%S)
TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S)

echo "=========================================="
echo "iDream Database Backup Script"
echo "=========================================="
echo "Timestamp: $TIMESTAMP"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if .env file exists to get MongoDB URI
ENV_FILE="/var/www/idream/backend/.env"
if [ -f "$ENV_FILE" ]; then
    # Source the .env file (basic parsing)
    MONGODB_URI=$(grep "^MONGODB_URI=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
else
    echo "Warning: .env file not found. Using default MongoDB URI."
    MONGODB_URI="mongodb://localhost:27017/idream"
fi

echo "Step 1: Creating backup directory..."
BACKUP_PATH="$BACKUP_DIR/$DATE"
mkdir -p "$BACKUP_PATH"

echo "Step 2: Dumping database..."
if [ -n "$MONGODB_URI" ]; then
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH"
else
    mongodump --db idream --out="$BACKUP_PATH"
fi

echo "Step 3: Compressing backup..."
tar -czf "$BACKUP_DIR/${DATE}.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_PATH"

BACKUP_SIZE=$(du -h "$BACKUP_DIR/${DATE}.tar.gz" | cut -f1)
echo "Step 4: Backup created successfully!"
echo "  File: $BACKUP_DIR/${DATE}.tar.gz"
echo "  Size: $BACKUP_SIZE"

echo "Step 5: Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo ""
echo "=========================================="
echo "Backup completed successfully!"
echo "=========================================="

