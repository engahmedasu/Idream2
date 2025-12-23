# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - Recommended) ⭐

**Easiest option - No installation required!**

1. **Sign up for MongoDB Atlas** (Free tier available):
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Create a free account

2. **Create a Cluster**:
   - Click "Build a Database"
   - Choose the FREE tier (M0)
   - Select a cloud provider and region (closest to you)
   - Click "Create"

3. **Create Database User**:
   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `idream-admin` (or your choice)
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Whitelist Your IP**:
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your IP
   - Click "Confirm"

5. **Get Connection String**:
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<username>` and `<password>` with your database user credentials
   - Add your database name at the end: `...mongodb.net/idream?retryWrites=true&w=majority`

6. **Update .env file**:
   ```env
   MONGODB_URI=mongodb+srv://idream-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/idream?retryWrites=true&w=majority
   ```

## Option 2: Local MongoDB Installation

### Windows Installation:

1. **Download MongoDB Community Server**:
   - Go to https://www.mongodb.com/try/download/community
   - Select:
     - Version: Latest (7.0 or newer)
     - Platform: Windows
     - Package: MSI
   - Click "Download"

2. **Install MongoDB**:
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - Choose "Install MongoDB as a Service"
   - Service Name: `MongoDB`
   - Run service as: `Network Service user`
   - Install MongoDB Compass (GUI tool) - recommended
   - Click "Install"

3. **Verify Installation**:
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   
   # Start MongoDB if not running
   net start MongoDB
   ```

4. **Update .env file**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/idream
   ```

### Alternative: MongoDB via Docker

If you have Docker installed:

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then use:
```env
MONGODB_URI=mongodb://localhost:27017/idream
```

## After Setup:

1. **Create .env file**:
   ```powershell
   cd backend
   copy .env.example .env
   ```

2. **Edit .env file** and update `MONGODB_URI` with your connection string

3. **Run the seed script**:
   ```powershell
   npm run seed
   ```

4. **Start the backend**:
   ```powershell
   npm run dev
   ```

## Troubleshooting:

- **Connection refused**: Make sure MongoDB is running
- **Authentication failed**: Check username/password in connection string
- **Network access denied**: Whitelist your IP in MongoDB Atlas
- **Port 27017 in use**: Another MongoDB instance might be running

