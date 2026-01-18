# iDream2 - Comprehensive E-Commerce Platform

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Business Overview](#business-overview)
3. [System Architecture](#system-architecture)
4. [Technical Stack](#technical-stack)
5. [Features & Functionality](#features--functionality)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Installation & Setup](#installation--setup)
9. [Deployment](#deployment)
10. [Business Rules & Validations](#business-rules--validations)
11. [User Roles & Permissions](#user-roles--permissions)
12. [Subscription System](#subscription-system)
13. [Security](#security)
14. [Testing](#testing)
15. [Maintenance & Support](#maintenance--support)

---

## 🎯 Executive Summary

**iDream2** is a comprehensive multi-tenant e-commerce platform designed to serve as a digital marketplace where shops can register, manage their products, and reach customers. The platform implements a subscription-based business model with flexible pricing tiers, role-based access control, and complete administrative oversight.

### Key Value Propositions
- **For Shop Owners**: Easy registration, product management, and subscription-based marketplace access
- **For Customers**: Seamless shopping experience with category browsing, product discovery, and cart management
- **For Administrators**: Complete control over users, shops, products, subscriptions, and business analytics

---

## 🏢 Business Overview

### Business Model
The platform operates on a **B2B2C (Business-to-Business-to-Consumer)** model:
- **Shops** subscribe to plans to list products on the marketplace
- **Subscription Plans** offer different tiers with varying limits (products, hot offers)
- **Revenue streams**: Subscription fees (monthly/yearly billing cycles)

### Target Users

#### 1. **Super Admin**
- Full system administration
- User, role, and permission management
- Shop and product approval workflows
- Subscription plan configuration
- Comprehensive reporting and analytics

#### 2. **Mall Admin**
- Shop management and approval
- Product review and approval
- Category management
- Access to reports

#### 3. **Shop Admin (Partners)**
- Product creation and management
- Shop profile management
- View subscription status
- Limited to their own shop data

#### 4. **Customers (Guest/Registered Users)**
- Browse shops and products
- Search functionality
- Shopping cart management
- Product reviews and ratings
- Account management

---

## 🏗️ System Architecture

### Architecture Pattern
**3-Tier Architecture** with separation of concerns:

```
┌─────────────────────────────────────────────────┐
│           Frontend Layer (React)                │
│  ┌──────────────┐      ┌──────────────┐        │
│  │ Public Portal │      │ Admin Portal │        │
│  │  (Port 3000)  │      │  (Port 3001) │        │
│  └──────────────┘      └──────────────┘        │
└─────────────────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │
┌─────────────────────────────────────────────────┐
│         Backend Layer (Node.js/Express)         │
│         API Server (Port 5000)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Controllers │ Services │ Middleware     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
                      │ Mongoose ODM
                      │
┌─────────────────────────────────────────────────┐
│           Data Layer (MongoDB)                  │
│         Document Database                       │
└─────────────────────────────────────────────────┘
```

### Component Architecture

#### **Frontend Portal** (`frontend-portal/`)
- **Purpose**: Public-facing customer interface
- **Technology**: React 18.3, React Router 7, Axios
- **Features**: 
  - Product browsing and search
- Shopping cart
  - Shop pages
  - Subscription plan display
  - Multi-language support (English/Arabic)

#### **Admin Portal** (`admin-portal/`)
- **Purpose**: Administrative dashboard
- **Technology**: React 18.3, React Router 7, Axios
- **Features**:
- User management
  - Shop approval and management
  - Product approval workflow
  - Subscription plan management
  - Reports and analytics
  - Role-based menu system

#### **Backend API** (`backend/`)
- **Purpose**: RESTful API server
- **Technology**: Node.js, Express 5.2, Mongoose
- **Features**:
  - JWT authentication
  - File upload handling
  - Email notifications
  - Swagger API documentation
  - Business logic enforcement

---

## 💻 Technical Stack

### Backend Technologies
- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose ODM 9.0.2
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **File Upload**: Multer 2.0.2
- **Email**: Nodemailer 7.0.11
- **Validation**: Express Validator 7.3.1
- **API Docs**: Swagger UI Express 5.0.1
- **Reports**: XLSX 0.18.5 (Excel export)
- **Password Hashing**: bcryptjs 3.0.3

### Frontend Technologies
- **Framework**: React 18.3.1
- **Routing**: React Router DOM 7.11.0
- **HTTP Client**: Axios 1.13.2
- **UI Icons**: React Icons 5.5.0
- **Notifications**: React Toastify 11.0.5
- **Internationalization**: 
  - i18next 25.7.3
  - react-i18next 16.5.0
  - i18next-browser-languagedetector 8.2.0
- **Build Tool**: CRACO 7.1.0 (Create React App Configuration Override)

### Development Tools
- **Process Manager**: Nodemon 3.1.11
- **Environment Variables**: dotenv 17.2.3
- **Package Manager**: npm

---

## ✨ Features & Functionality

### 1. User Management

#### Registration & Authentication
- **Email/Phone Registration**: Users can register with email and phone number
- **OTP Verification**: Email-based OTP verification system
- **JWT Authentication**: Token-based authentication for API access
- **Password Security**: bcrypt hashing with salt rounds

#### User Roles
- **SuperAdmin**: Full system access
- **MallAdmin**: Shop and product management
- **ShopAdmin**: Own shop management
- **Guest**: Browse-only access

### 2. Shop Management

#### Shop Registration
- **Enterprise Portal**: Dedicated registration interface for shop owners
- **Required Information**:
  - Shop name, email, mobile, WhatsApp
  - Address, category, product types
  - Instagram, Facebook (optional)
  - Shop image upload
- **Approval Workflow**: Requires SuperAdmin/MallAdmin approval
- **Auto User Creation**: Shop registration creates associated user account

#### Shop Features
- **Share Links**: Unique shareable links for each shop
- **Priority System**: Sort order for featured shop display
- **Product Types**: Customizable product type filters
- **Status Management**: Active/Inactive, Approved/Pending states

### 3. Product Management

#### Product Creation
- **Required Fields**:
  - Name, description, price
  - Category, shop association
  - Product image
- **Optional Features**:
  - Hot offer flag
  - Priority for sorting
  - Product type classification
  - Shipping information (title, description, fees)
  - Warranty information

#### Product Approval Workflow
- **Dual Approval System**:
  - `isApproved`: Content approval
  - `isActive`: Activation status
- **Image Quality Comments**: Admin can add feedback on image quality
- **Approval Tracking**: Records who approved and when

#### Subscription-Based Limits
- **Max Products**: Enforced per subscription plan
- **Max Hot Offers**: Separate limit for featured products
- **Real-time Validation**: Checks active, approved counts
- **User-Friendly Messages**: Clear error messages when limits reached

### 4. Category Management
- **Hierarchical Categories**: Support for parent-child relationships
- **Icons**: Image-based category icons
- **Active/Inactive Status**: Category visibility control
- **Category Pages**: Dedicated pages showing category products, shops, and hot offers

### 5. Shopping Experience

#### Product Discovery
- **Category Navigation**: Browse by categories
- **Search Functionality**: Search across shops, products
- **Hot Offers Section**: Featured products carousel
- **Featured Shops**: Priority-ordered shop listings
- **Product Filters**: Filter by product type within shops

#### Shopping Cart
- **Guest Cart**: Cart functionality for non-registered users
- **User Cart**: Persistent cart for registered users
- **Cart Sidebar**: Slide-out cart interface
- **Item Management**: Add, remove, update quantities

#### Product Details
- **Detailed Views**: Full product information
- **Reviews & Ratings**: Customer feedback system
- **Share Functionality**: Social sharing capabilities
- **Add to Cart**: Direct cart integration

### 6. Subscription Management System

#### Subscription Plans
- **Plan Configuration**:
  - Display name
  - Features list (bullet points)
  - Sort order
  - Active/Inactive status
- **Pricing Structure**:
  - Monthly pricing (EGP)
  - Yearly pricing (EGP)
  - Currency: EGP (default)
- **Plan Limits**:
  - `max_products`: Maximum active products (-1 for unlimited)
  - `max_hot_offers`: Maximum hot offers (-1 for unlimited)

#### Billing Cycles
- **Predefined Cycles**:
  - Monthly (30 days)
  - Yearly (365 days)
- **Customizable**: Duration can be configured
- **CRUD Operations**: Full create, read, update, delete support

#### Shop Subscriptions
- **Subscription Assignment**: Link shop to plan and billing cycle
- **Date Management**:
  - Start date
  - End date (calculated from billing cycle)
- **Status Tracking**:
  - Active
  - Expired
  - Cancelled
  - Pending
- **Overlap Validation**: Prevents conflicting active subscriptions
- **Subscription Logs**: Complete audit trail of all changes

#### Subscription Logging
- **Change Tracking**: Logs all subscription modifications
- **Fields Tracked**:
  - Previous and new plan/billing cycle
  - Start/end dates
  - Status changes
  - Changed by (user reference)
  - Timestamp

### 7. Reporting & Analytics

#### Available Reports
- **Products Report**: Export product data with filters
- **Sharing Report**: Track product/shop shares
- **Orders Report**: Order history and analytics
- **Subscription Logs Report**: Subscription change history

#### Report Features
- **Date Range Filtering**: From/To date selection
- **Excel Export**: XLSX format downloads
- **Filtering Options**: Status, category, approval filters
- **Admin Access**: SuperAdmin and MallAdmin only

### 8. Internationalization (i18n)
- **Supported Languages**: English, Arabic
- **RTL Support**: Right-to-left layout for Arabic
- **Language Switcher**: Easy language toggle in header
- **Persistent Selection**: Language preference saved in localStorage

---

## 🗄️ Database Schema

### Core Collections

#### **Users** (`users`)
```javascript
{
  email: String (unique, required),
  phone: String (required),
  password: String (hashed, required),
  role: ObjectId (ref: Role),
  isActive: Boolean,
  otp: String,
  otpExpiry: Date,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Roles** (`roles`)
```javascript
{
  name: String (enum: superAdmin, mallAdmin, shopAdmin, guest),
  description: String,
  permissions: [ObjectId] (ref: Permission),
  isActive: Boolean
}
```

#### **Permissions** (`permissions`)
```javascript
{
  name: String (unique, required),
  description: String,
  resource: String (enum: user, role, permission, category, shop, product, cart, review, report),
  action: String (enum: create, read, update, delete, activate, deactivate, export),
  isActive: Boolean
}
```

#### **Shops** (`shops`)
```javascript
{
  name: String (required),
  email: String (unique, required),
  mobile: String (required),
  whatsapp: String (required),
  instagram: String,
  facebook: String,
  address: String,
  image: String,
  category: ObjectId (ref: Category),
  priority: Number (default: 0),
  productTypes: [String],
  shareLink: String (unique),
  isActive: Boolean,
  isApproved: Boolean,
  approvedBy: ObjectId (ref: User),
  approvedAt: Date
}
```

#### **Products** (`products`)
```javascript
{
  name: String (required),
  description: String (required),
  image: String (required),
  price: Number (required, min: 0),
  isHotOffer: Boolean (default: false),
  priority: Number (default: 0),
  shippingTitle: String,
  shippingDescription: String,
  shippingFees: Number (default: 0),
  warrantyTitle: String,
  warrantyDescription: String,
  averageRating: Number (default: 0),
  totalReviews: Number (default: 0),
  shop: ObjectId (ref: Shop, required),
  category: ObjectId (ref: Category, required),
  productType: String,
  isActive: Boolean (default: false),
  isApproved: Boolean (default: false),
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  imageQualityComment: String
}
```

#### **Categories** (`categories`)
```javascript
{
  name: String (required, unique),
  description: String,
  icon: String,
  parentCategory: ObjectId (ref: Category),
  isActive: Boolean,
  sortOrder: Number
}
```

#### **Subscription Plans** (`subscriptionplans`)
```javascript
{
  displayName: String (required),
  description: String,
  isActive: Boolean,
  sortOrder: Number
}
```

#### **Subscription Plan Features** (`subscriptionplanfeatures`)
```javascript
{
  subscriptionPlan: ObjectId (ref: SubscriptionPlan, required),
  title: String (required),
  isHighlighted: Boolean,
  sortOrder: Number
}
```

#### **Subscription Plan Limits** (`subscriptionplanlimits`)
```javascript
{
  subscriptionPlan: ObjectId (ref: SubscriptionPlan, required),
  limitKey: String (e.g., "max_products", "max_hot_offers"),
  limitValue: Number (-1 for unlimited)
}
```

#### **Subscription Pricing** (`subscriptionpricing`)
```javascript
{
  subscriptionPlan: ObjectId (ref: SubscriptionPlan, required),
  billingCycle: ObjectId (ref: BillingCycle, required),
  price: Number (required),
  currency: String (default: "USD"),
  discount: Number (default: 0),
  isActive: Boolean
}
```

#### **Billing Cycles** (`billingcycles`)
```javascript
{
  name: String (required, unique, e.g., "monthly", "yearly"),
  displayName: String (required),
  durationInDays: Number (required),
  isActive: Boolean
}
```

#### **Shop Subscriptions** (`shopsubscriptions`)
```javascript
{
  shop: ObjectId (ref: Shop, required, unique),
  subscriptionPlan: ObjectId (ref: SubscriptionPlan, required),
  billingCycle: ObjectId (ref: BillingCycle, required),
  startDate: Date (required),
  endDate: Date (required),
  status: String (enum: active, expired, cancelled, pending),
  scheduledDowngrade: {
    subscriptionPlan: ObjectId,
    billingCycle: ObjectId,
    effectiveDate: Date
  }
}
```

#### **Subscription Logs** (`subscriptionlogs`)
```javascript
{
  shop: ObjectId (ref: Shop, required),
  previousPlan: ObjectId (ref: SubscriptionPlan),
  newPlan: ObjectId (ref: SubscriptionPlan),
  previousBillingCycle: ObjectId (ref: BillingCycle),
  newBillingCycle: ObjectId (ref: BillingCycle),
  previousStartDate: Date,
  newStartDate: Date,
  previousEndDate: Date,
  newEndDate: Date,
  previousStatus: String,
  newStatus: String,
  changedBy: ObjectId (ref: User),
  changeReason: String
}
```

#### **Carts** (`carts`)
```javascript
{
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### **Reviews** (`reviews`)
```javascript
{
  product: ObjectId (ref: Product, required),
  user: ObjectId (ref: User, required),
  rating: Number (1-5, required),
  comment: String,
  isActive: Boolean
}
```

#### **Share Logs** (`sharelogs`)
```javascript
{
  type: String (enum: product, shop),
  itemId: ObjectId,
  itemName: String,
  channel: String (e.g., "web_share", "copy_link"),
  sharedBy: ObjectId (ref: User)
}
```

#### **Order Logs** (`orderlogs`)
```javascript
{
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String
}
```

### Database Indexes

#### Performance Indexes
- `users.email`: Unique index
- `shops.email`: Unique index
- `shops.shareLink`: Unique index
- `products.shop`: Index for shop product queries
- `products.category`: Index for category filtering
- `shopsubscriptions.shop`: Index for active subscription lookup
- `subscriptionplanfeatures.subscriptionPlan + sortOrder`: Compound index

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT authentication:
```http
Authorization: Bearer <token>
```

### Swagger Documentation
Interactive API documentation available at:
```
http://localhost:5000/api-docs
```

### Key API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /verify-otp` - Verify email OTP
- `GET /me` - Get current user

#### Users (`/api/users`)
- `GET /users` - List users (Admin)
- `POST /users` - Create user (Admin)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin)
- `PATCH /users/:id/activate` - Activate user (Admin)
- `PATCH /users/:id/deactivate` - Deactivate user (Admin)

#### Shops (`/api/shops`)
- `GET /shops` - List shops (with filters)
- `GET /shops/:id` - Get shop details
- `GET /shops/share/:shareLink` - Get shop by share link
- `POST /shops` - Create shop
- `PUT /shops/:id` - Update shop
- `DELETE /shops/:id` - Delete shop
- `PATCH /shops/:id/activate` - Activate shop
- `PATCH /shops/:id/deactivate` - Deactivate shop

#### Products (`/api/products`)
- `GET /products` - List products (with filters)
- `GET /products/:id` - Get product details
- `GET /products/hot-offers` - Get hot offers
- `GET /products/limits/status` - Get subscription limits status
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `PATCH /products/:id/activate` - Activate product
- `PATCH /products/:id/deactivate` - Deactivate product

#### Categories (`/api/categories`)
- `GET /categories` - List categories
- `GET /categories/:id` - Get category with products/shops
- `POST /categories` - Create category (Admin)
- `PUT /categories/:id` - Update category (Admin)
- `DELETE /categories/:id` - Delete category (Admin)

#### Subscriptions (`/api/subscriptions`)
- `GET /subscriptions/plans` - Get all active plans (public)
- `GET /subscriptions/admin/plans` - Get all plans (admin)
- `POST /subscriptions/admin/plans` - Create plan (SuperAdmin)
- `PUT /subscriptions/admin/plans/:id` - Update plan (SuperAdmin)
- `DELETE /subscriptions/admin/plans/:id` - Delete plan (SuperAdmin)
- `GET /subscriptions/admin/plans/:id/features` - Get plan features
- `POST /subscriptions/admin/plans/:id/features` - Add feature
- `GET /subscriptions/admin/plans/:id/limits` - Get plan limits
- `POST /subscriptions/admin/plans/:id/limits` - Set plan limit
- `GET /subscriptions/admin/plans/:id/pricing` - Get plan pricing
- `POST /subscriptions/admin/plans/:id/pricing` - Set plan pricing
- `GET /subscriptions/admin/shop-subscriptions` - Get all shop subscriptions
- `POST /subscriptions/admin/shop-subscriptions` - Assign subscription to shop
- `GET /subscriptions/admin/logs` - Get subscription logs (with date filters)

#### Billing Cycles (`/api/billingcycles`)
- `GET /billingcycles` - List billing cycles
- `POST /billingcycles` - Create billing cycle (SuperAdmin)
- `PUT /billingcycles/:id` - Update billing cycle (SuperAdmin)
- `DELETE /billingcycles/:id` - Delete billing cycle (SuperAdmin)
- `PATCH /billingcycles/:id/toggle` - Toggle active status

#### Reports (`/api/reports`)
- `GET /reports/products` - Products report (Excel export)
- `GET /reports/shares` - Sharing report (Excel export)
- `GET /reports/orders` - Orders report (Excel export)
- `GET /reports/subscription-logs` - Subscription logs report (Excel export)

#### Cart (`/api/cart`)
- `GET /cart` - Get user cart
- `POST /cart` - Add item to cart
- `PUT /cart/:itemId` - Update cart item
- `DELETE /cart/:itemId` - Remove cart item
- `DELETE /cart` - Clear cart

#### Reviews (`/api/reviews`)
- `GET /reviews/product/:productId` - Get product reviews
- `POST /reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

#### Shares (`/api/shares`)
- `POST /shares` - Log share action

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v16 or higher
- **MongoDB**: v5.0 or higher (local or Atlas)
- **npm**: v8 or higher

### Environment Variables

Create `.env` file in `backend/` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/idream
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/idream

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Port
PORT=5000

# Email Configuration (for OTP - Zoho Mail)
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_USER=your-email@zoho.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@idreamegypt.com
```

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/engahmedasu/Idream2.git
cd Idream2
```

#### 2. Install Dependencies
```bash
# Install all dependencies (root, backend, frontend-portal, admin-portal)
npm run install:all
```

#### 3. Start MongoDB
```bash
# Windows (as Administrator)
net start MongoDB

# Or start MongoDB service manually
mongod
```

#### 4. Initialize Database
```bash
cd backend

# Seed initial data (optional)
npm run seed

# Initialize billing cycles
npm run init-billing-cycles

# Initialize subscription system
npm run init-subscription-system

# Initialize subscription logs
npm run init-subscription-logs

# Add product limits to existing plans
npm run add-product-limits

# Add pricing to plans
npm run add-pricing-to-plans
```

#### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend Portal:**
```bash
npm run dev:portal
```
Frontend runs on: `http://localhost:3000`

**Terminal 3 - Admin Portal:**
```bash
npm run dev:admin
```
Admin Portal runs on: `http://localhost:3001`

### Default Admin Account
After seeding, default SuperAdmin credentials:
- **Email**: admin@idreamegypt.com
- **Password**: (check seed script for password)

---

## 📦 Deployment

### Production Build

#### Backend
```bash
cd backend
npm install --production
NODE_ENV=production node server.js
```

#### Frontend Portal
```bash
cd frontend-portal
npm run build
# Serve build/ directory with web server (nginx, Apache, etc.)
```

#### Admin Portal
```bash
cd admin-portal
npm run build
# Serve build/ directory with web server
```

### Deployment Recommendations
- **Backend**: Use PM2 or Docker for process management
- **Frontend**: Serve static files through CDN or web server
- **Database**: Use MongoDB Atlas for managed database
- **File Storage**: Consider cloud storage (AWS S3, Azure Blob) for uploads
- **Environment**: Use environment-specific `.env` files

---

## 📐 Business Rules & Validations

### Product Creation Rules
1. **Subscription Limits**:
   - Shop must have active subscription
   - Product count cannot exceed `max_products` limit
   - Hot offers cannot exceed `max_hot_offers` limit
   - Only **active and approved** products count toward limits

2. **Approval Workflow**:
   - Products require admin approval (`isApproved`)
   - Products require activation (`isActive`)
   - Both must be true for product to be visible

3. **Validation Messages**:
   - Clear error messages when limits reached
   - Hot offer checkbox hidden when limit met (if not already hot offer)

### Subscription Rules
1. **Overlap Prevention**:
   - Cannot create overlapping active subscriptions
   - System detects conflicts and prompts for overwrite/cancel
   - Overwrite creates new subscription, ends old one

2. **End Date Calculation**:
   - `endDate = startDate + billingCycle.durationInDays`

3. **Status Management**:
   - Active: Current date within startDate-endDate range
   - Expired: Current date > endDate
   - Cancelled: Manually cancelled
   - Pending: Not yet active

### Shop Approval Rules
1. **Dual Approval**:
   - `isApproved`: Content/verification approval
   - `isActive`: Activation status
   - Both required for shop to be visible

2. **Auto User Creation**:
   - Shop registration creates associated ShopAdmin user
   - User email matches shop email

### User Management Rules
1. **Role Hierarchy**:
   - SuperAdmin > MallAdmin > ShopAdmin > Guest
   - Higher roles can manage lower roles

2. **Activation**:
   - Users can be activated/deactivated
   - Inactive users cannot login

---

## 👥 User Roles & Permissions

### Role Matrix

| Feature | SuperAdmin | MallAdmin | ShopAdmin | Guest |
|---------|-----------|-----------|-----------|-------|
| User Management | ✅ Full | ❌ | ❌ | ❌ |
| Role/Permission Management | ✅ Full | ❌ | ❌ | ❌ |
| Shop Management | ✅ Full | ✅ Full | Own Shop | ❌ |
| Product Management | ✅ Full | ✅ Full | Own Shop | ❌ |
| Category Management | ✅ Full | ✅ Full | ❌ | ❌ |
| Subscription Plans | ✅ Full | ❌ | ❌ | ❌ |
| Billing Cycles | ✅ Full | ❌ | ❌ | ❌ |
| Reports | ✅ All | ✅ All | ❌ | ❌ |
| Shop Approval | ✅ | ✅ | ❌ | ❌ |
| Product Approval | ✅ | ✅ | ❌ | ❌ |
| Browse Products | ✅ | ✅ | ✅ | ✅ |
| Shopping Cart | ✅ | ✅ | ✅ | ✅ |
| Reviews | ✅ | ✅ | ✅ | ✅ |

### Permission System
- **Resource-based**: Permissions tied to resources (user, shop, product, etc.)
- **Action-based**: Permissions for actions (create, read, update, delete, etc.)
- **Dynamic**: Roles can have custom permission sets
- **Middleware**: `auth.js` middleware enforces permissions

---

## 💳 Subscription System

### Subscription Plan Structure

#### Plan Configuration
```javascript
{
  displayName: "Basic Plan",
  features: [
    "Up to 50 products",
    "5 hot offers",
    "Priority support",
    "Analytics dashboard"
  ],
  pricing: {
    monthly: 59.00,  // EGP
    yearly: 590.00   // EGP (calculated or set)
  },
  limits: {
    max_products: 50,
    max_hot_offers: 5
  }
}
```

#### Feature Display
- Features displayed as bullet points in frontend
- Configurable per plan in admin portal
- Similar to product types (add/remove interface)

#### Pricing Model
- **Monthly Billing**: Recurring monthly charges
- **Yearly Billing**: Recurring yearly charges (often discounted)
- **Currency**: EGP (Egyptian Pound)
- **Discount Support**: Can apply discounts to pricing

### Subscription Assignment Workflow

1. **Shop Registration**: Shop owner selects plan during registration
2. **Admin Assignment**: Admin can assign/change shop subscriptions
3. **Conflict Detection**: System checks for overlapping subscriptions
4. **Resolution**: Admin chooses overwrite or cancel
5. **Logging**: All changes logged in SubscriptionLog

### Subscription Limits Enforcement

#### Product Limits
```javascript
// Backend validation in productController.js
const activeProducts = await Product.countDocuments({
  shop: shopId,
  isActive: true,
  isApproved: true
});

if (activeProducts >= maxProducts) {
  return error: "Maximum products limit reached"
}
```

#### Hot Offer Limits
```javascript
const activeHotOffers = await Product.countDocuments({
  shop: shopId,
  isActive: true,
  isApproved: true,
  isHotOffer: true
});

if (activeHotOffers >= maxHotOffers) {
  return error: "Maximum hot offers limit reached"
}
```

### Frontend Integration
- **Subscription Plans Page**: Displays all plans with pricing
- **Feature Comparison**: Shows features as bullet points
- **Order Flow**: "Become a Partner" → Plans → Registration
- **Billing Cycle Toggle**: Switch between monthly/yearly pricing

---

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Token Expiry**: Configurable token expiration
- **Role-Based Access**: Middleware enforces role permissions
- **Password Security**: bcrypt hashing with salt

### Data Validation
- **Input Validation**: Express Validator for request validation
- **MongoDB Injection Prevention**: Mongoose sanitization
- **File Upload Security**: Multer file type and size restrictions

### API Security
- **CORS Configuration**: Cross-origin resource sharing control
- **Rate Limiting**: (Recommended: Add rate limiting middleware)
- **Helmet**: (Recommended: Add Helmet.js for security headers)

### File Upload Security
- **File Type Validation**: Image types only
- **File Size Limits**: Configurable maximum file size
- **Secure Storage**: Files stored in `uploads/` directory

---

## 🧪 Testing

### Manual Testing Checklist

#### User Management
- [ ] User registration with email/phone
- [ ] OTP verification
- [ ] Login/logout
- [ ] Password reset (if implemented)
- [ ] Role-based access control

#### Shop Management
- [ ] Shop registration
- [ ] Shop approval workflow
- [ ] Shop activation/deactivation
- [ ] Shop profile updates
- [ ] Share link functionality

#### Product Management
- [ ] Product creation
- [ ] Subscription limit enforcement
- [ ] Product approval workflow
- [ ] Hot offer limits
- [ ] Product updates
- [ ] Product deletion

#### Subscription System
- [ ] Plan creation
- [ ] Feature management
- [ ] Pricing configuration
- [ ] Subscription assignment
- [ ] Overlap detection
- [ ] Subscription logs

#### Shopping Experience
- [ ] Product browsing
- [ ] Search functionality
- [ ] Category navigation
- [ ] Shopping cart
- [ ] Product reviews
- [ ] Share functionality

---

## 🛠️ Maintenance & Support

### Database Migrations
Located in `backend/scripts/`:

1. **initBillingCycles.js**: Initialize monthly/yearly cycles
2. **initSubscriptionSystem.js**: Set up subscription infrastructure
3. **initSubscriptionLogs.js**: Initialize subscription logging
4. **addProductLimitsMigration.js**: Add limits to existing plans
5. **addPricingToPlansMigration.js**: Add pricing structure

### Regular Maintenance Tasks
1. **Monitor Subscription Expiry**: Check and update expired subscriptions
2. **Database Indexes**: Monitor and optimize query performance
3. **File Cleanup**: Remove orphaned image files
4. **Log Rotation**: Manage subscription and activity logs
5. **Backup**: Regular MongoDB backups

### Troubleshooting

#### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
net start MongoDB  # Windows
sudo systemctl status mongod  # Linux

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/idream
```

**Port Already in Use**
```bash
# Change port in .env or package.json
PORT=5001  # Backend
PORT=3002  # Frontend
```

**Authentication Errors**
- Verify JWT_SECRET is set
- Check token expiration
- Verify user role permissions

---

## 📊 Business Metrics & Analytics

### Key Performance Indicators (KPIs)

#### Platform Metrics
- Total registered shops
- Active subscriptions
- Total products
- Active products
- Hot offers count

#### User Metrics
- Total users by role
- Active users
- Guest vs registered users

#### Subscription Metrics
- Revenue by plan type
- Subscription renewal rate
- Average subscription duration
- Churn rate

#### Product Metrics
- Products per shop (average)
- Hot offer utilization
- Product approval rate
- Time to approval

### Report Generation
All reports export to Excel format:
- Filterable by date ranges
- Exportable data sets
- Admin access only

---

## 🔄 Version History

### Current Version: 1.0.0

#### Major Features Implemented
1. ✅ User management with roles and permissions
2. ✅ Shop registration and approval workflow
3. ✅ Product management with subscription limits
4. ✅ Category management
5. ✅ Shopping cart functionality
6. ✅ Product reviews and ratings
7. ✅ Subscription plan management
8. ✅ Billing cycle management
9. ✅ Subscription assignment and tracking
10. ✅ Subscription logging and audit trail
11. ✅ Reporting system (Products, Shares, Orders, Subscriptions)
12. ✅ Internationalization (English/Arabic)
13. ✅ Enterprise portal for shop registration
14. ✅ Subscription plans display in frontend

---

## 📞 Support & Contact

### Repository
- **GitHub**: https://github.com/engahmedasu/Idream2
- **Issues**: Use GitHub Issues for bug reports and feature requests

### Documentation
- **API Docs**: http://localhost:5000/api-docs (Swagger UI)
- **Code Comments**: Inline documentation in source code

---

## 📝 License

[Specify License - ISC, MIT, etc.]

---

## 🙏 Acknowledgments

- MongoDB for database solution
- React team for frontend framework
- Express.js for backend framework
- All open-source contributors

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Status**: Production Ready
