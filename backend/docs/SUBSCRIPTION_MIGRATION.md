# Subscription System Database Migration Guide

## Overview

This guide explains how to initialize the subscription system database collections and set up the required data.

## Prerequisites

- MongoDB database is running and accessible
- `.env` file is configured with `MONGODB_URI`
- All subscription models are defined in `backend/models/`

## Migration Scripts

### 1. Initialize Subscription System (Recommended)

This is the main migration script that sets up everything needed for the subscription system.

```bash
npm run init-subscription-system
```

**What it does:**
- ✅ Creates monthly and yearly billing cycles
- ✅ Verifies all subscription collections exist
- ✅ Checks for existing plans
- ✅ Provides next steps guidance

**Output:**
```
🚀 Starting subscription system initialization...

📅 Initializing billing cycles...
   ✅ Created billing cycle: Monthly (30 days)
   ✅ Created billing cycle: Yearly (365 days)

📋 Verifying subscription collections...
   ✅ Collection "subscriptionplans" exists
   ✅ Collection "subscriptionplanfeatures" exists
   ...

✅ Subscription system initialization completed successfully!
```

### 2. Initialize Billing Cycles Only

If you only need to create/update billing cycles:

```bash
npm run init-billing-cycles
```

**What it does:**
- Creates monthly (30 days) and yearly (365 days) billing cycles
- Skips if they already exist

## Collections Created

The migration will ensure these collections exist:

1. **subscriptionplans** - Subscription plan definitions
2. **subscriptionplanfeatures** - Features list for each plan (display text)
3. **subscriptionplanlimits** - Enforcement limits for each plan
4. **billingcycles** - Billing cycle definitions (monthly, yearly)
5. **subscriptionpricings** - Pricing per plan + billing cycle
6. **shopsubscriptions** - Active shop subscriptions
7. **subscriptionusages** - Usage tracking per shop

## Indexes

Mongoose models automatically create the following indexes:

### SubscriptionPlan
- `{ isActive: 1, sortOrder: 1 }`

### SubscriptionPlanFeature
- `{ subscriptionPlan: 1, sortOrder: 1 }`

### SubscriptionPlanLimit
- `{ subscriptionPlan: 1, limitKey: 1 }` (unique)

### BillingCycle
- `{ isActive: 1, name: 1 }`
- `{ name: 1 }` (unique)

### SubscriptionPricing
- `{ subscriptionPlan: 1, billingCycle: 1 }` (unique)
- `{ isActive: 1 }`

### ShopSubscription
- `{ shop: 1, status: 1 }`
- `{ shop: 1 }` (unique)
- `{ endDate: 1, status: 1 }`

### SubscriptionUsage
- `{ shop: 1, limitKey: 1 }` (unique)
- `{ shop: 1 }`

## Post-Migration Steps

After running the migration:

1. **Create Subscription Plans** via admin portal:
   - Navigate to "Subscription Plans" in admin portal
   - Create plans (e.g., Free, Silver, Gold)

2. **Add Features** to each plan:
   - Select a plan and click "Manage"
   - Add features (display text for pricing page)
   - Example: "Up to 50 products", "Priority Support"

3. **Set Limits** for each plan:
   - Add limit keys and values
   - Example: `MAX_PRODUCTS: 50`, `MAX_HOT_OFFERS: 5`
   - Use `-1` for unlimited

4. **Configure Pricing**:
   - Set price for each plan + billing cycle combination
   - Add currency and discount if needed

5. **Assign Subscriptions** to shops:
   - Go to "Shop Subscriptions" tab
   - Assign plans to shops

## Verification

To verify the migration was successful:

```javascript
// Connect to MongoDB and check
use idream;

// Check billing cycles
db.billingcycles.find().pretty();

// Should show:
// - Monthly (30 days)
// - Yearly (365 days)

// Check collections exist
show collections;
// Should include all subscription-related collections
```

## Troubleshooting

### Error: "Collection already exists"
- This is normal if you've run the migration before
- The script will skip existing records

### Error: "MongoDB connection error"
- Check that MongoDB is running
- Verify `MONGODB_URI` in `.env` file
- Ensure network connectivity

### Error: "Model not found"
- Ensure all model files exist in `backend/models/`
- Check that models are properly exported

## Rollback

If you need to remove the subscription system:

```javascript
// Connect to MongoDB
use idream;

// Remove all subscription collections (CAUTION: This deletes all data!)
db.subscriptionplans.drop();
db.subscriptionplanfeatures.drop();
db.subscriptionplanlimits.drop();
db.billingcycles.drop();
db.subscriptionpricings.drop();
db.shopsubscriptions.drop();
db.subscriptionusages.drop();
```

**⚠️ Warning:** This will permanently delete all subscription data!

## Notes

- The migration is **idempotent** - safe to run multiple times
- Existing data will not be overwritten
- Billing cycles are only created if they don't exist
- Collections are created automatically on first document insert

