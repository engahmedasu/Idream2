# iDream Portal

A comprehensive e-commerce platform with shop management, product catalog, and admin portal.

## Project Structure

- `backend/` - Node.js/Express API server
- `frontend-portal/` - React public-facing portal
- `admin-portal/` - React admin dashboard

## Features

### Roles
- **SuperAdmin**: Full system management, user/role/permission management
- **MallAdmin**: Shop and product management
- **ShopAdmin**: Product management for their shop
- **Guest Users**: Browse, cart, and product reviews

### Portal Features
- Category-based navigation
- Hot offers banners
- Shop listings
- Product catalog with filters
- Shopping cart
- Product reviews
- WhatsApp contact

### Admin Features
- User management
- Shop approval workflow
- Product review and approval
- Reports and exports
- Image quality comments

## Getting Started

### Installation

```bash
npm run install:all
```

### Development

```bash
# Backend API
npm run dev:backend

# Frontend Portal (runs on http://localhost:3000)
npm run dev:portal

# Admin Portal (runs on http://localhost:3001)
npm run dev:admin
```

## API Documentation

Swagger API documentation is available when the backend server is running:

**Swagger UI**: http://localhost:5000/api-docs

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive API testing
- Authentication support (JWT Bearer token)

### Using Swagger UI

1. Start the backend server: `npm run dev:backend`
2. Open http://localhost:5000/api-docs in your browser
3. Click "Authorize" button to add your JWT token for protected endpoints
4. Test any endpoint directly from the Swagger UI

### Getting a JWT Token

1. Use the `/api/auth/login` endpoint to login
2. Copy the `token` from the response
3. Click "Authorize" in Swagger UI and paste the token
4. All protected endpoints will now be accessible

## MongoDB Setup

MongoDB must be running before starting the backend server.

### Starting MongoDB on Windows:

**Option 1: Start as Windows Service (Recommended)**
```powershell
# Run PowerShell as Administrator, then:
net start MongoDB
```

**Option 2: Start MongoDB Manually**
```bash
# Navigate to MongoDB bin directory (usually C:\Program Files\MongoDB\Server\<version>\bin)
mongod --dbpath "C:\data\db"
```

**Option 3: Use MongoDB Atlas (Cloud)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get connection string
3. Add to `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/idream
   ```

### Verify MongoDB is Running:
```bash
# Check if MongoDB service is running
Get-Service MongoDB

# Or test connection
mongosh
```

## Environment Variables

See `backend/.env.example` for required environment variables.

