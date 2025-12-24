#!/bin/bash

# iDream Complete Deployment Script
# This script deploys all components (backend, frontend, admin)

set -e  # Exit on error

echo "=========================================="
echo "iDream Complete Deployment Script"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# Deploy backend
echo ""
echo "Deploying Backend..."
echo "----------------------------------------"
bash "$SCRIPT_DIR/deploy-backend.sh"

# Deploy frontend
echo ""
echo "Deploying Frontend Portal..."
echo "----------------------------------------"
bash "$SCRIPT_DIR/deploy-frontend.sh"

# Deploy admin portal
echo ""
echo "Deploying Admin Portal..."
echo "----------------------------------------"
bash "$SCRIPT_DIR/deploy-admin.sh"

echo ""
echo "=========================================="
echo "Complete deployment finished!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check all services are running:"
echo "   - pm2 status"
echo "   - sudo systemctl status nginx"
echo "2. Test your deployment:"
echo "   - Frontend: https://www.yourdomain.com"
echo "   - Admin: https://admin.yourdomain.com"
echo "   - API: https://api.yourdomain.com/api/health"
echo "3. View logs if needed:"
echo "   - pm2 logs idream-backend"
echo "   - sudo tail -f /var/log/nginx/error.log"
echo "=========================================="

