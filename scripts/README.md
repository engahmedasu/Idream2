# Deployment Scripts

This directory contains automation scripts for deploying the iDream platform.

## Scripts Overview

### `setup-server.sh`
**Purpose**: Initial server setup - installs all dependencies  
**Usage**: Run once on a fresh Ubuntu server  
**Requires**: sudo/root access

```bash
chmod +x setup-server.sh
./setup-server.sh
```

### `deploy-backend.sh`
**Purpose**: Deploy backend API  
**Usage**: After code is uploaded and .env is configured  
**Actions**:
- Installs dependencies
- Creates upload directories
- Starts/restarts PM2 process

```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

### `deploy-frontend.sh`
**Purpose**: Build and deploy frontend portal  
**Usage**: After code is uploaded and .env is configured  
**Actions**:
- Installs dependencies
- Builds production bundle
- Reloads Nginx

```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

### `deploy-admin.sh`
**Purpose**: Build and deploy admin portal  
**Usage**: After code is uploaded and .env is configured  
**Actions**:
- Installs dependencies
- Builds production bundle
- Reloads Nginx

```bash
chmod +x deploy-admin.sh
./deploy-admin.sh
```

### `deploy-all.sh`
**Purpose**: Deploy all components (backend, frontend, admin)  
**Usage**: Deploys everything in one go  
**Actions**:
- Runs deploy-backend.sh
- Runs deploy-frontend.sh
- Runs deploy-admin.sh

```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

## Usage Instructions

1. **Make scripts executable**:
   ```bash
   chmod +x scripts/*.sh
   ```

2. **For first-time setup**:
   ```bash
   ./scripts/setup-server.sh
   ```

3. **After uploading code**:
   ```bash
   # Deploy everything
   ./scripts/deploy-all.sh
   
   # Or deploy individually
   ./scripts/deploy-backend.sh
   ./scripts/deploy-frontend.sh
   ./scripts/deploy-admin.sh
   ```

## Prerequisites

- Ubuntu 20.04/22.04 LTS
- Sudo/root access
- Application code uploaded to `/var/www/idream/`
- Environment files (`.env`) configured

## Notes

- Scripts assume standard directory structure: `/var/www/idream/{backend,frontend-portal,admin-portal}`
- All scripts use `set -e` to exit on error
- Scripts will prompt for confirmation where needed
- Always review scripts before running in production

