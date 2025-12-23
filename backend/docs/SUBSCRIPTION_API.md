# Subscription Plan API Documentation

## Overview

The subscription system is fully configurable from the admin portal. It supports:
- Monthly and yearly billing cycles
- Dynamic limits per plan
- Dynamic feature lists per plan (display-only for frontend pricing page)
- Usage tracking to avoid heavy queries

## Key Concepts

1. **Features**: Display-only descriptive text shown on pricing page (e.g., "Up to 50 products", "Priority Support")
2. **Limits**: Enforcement keys used for backend validation (e.g., `MAX_PRODUCTS: 50`, `MAX_HOT_OFFERS: 5`)
3. **Billing Cycles**: Monthly (30 days) and Yearly (365 days) - configurable duration
4. **Pricing**: Defined per (Plan + Billing Cycle) combination

## Public API Endpoint

### GET /api/subscriptions/plans

Returns all active subscription plans with their features, limits, and pricing optimized for frontend pricing page.

**Response Structure:**

```json
{
  "plans": [
    {
      "_id": "plan_id",
      "displayName": "Free",
      "description": "Basic plan for small shops",
      "features": [
        {
          "title": "Up to 10 products",
          "isHighlighted": false
        },
        {
          "title": "Basic support",
          "isHighlighted": false
        }
      ],
      "limits": {
        "MAX_PRODUCTS": 10,
        "MAX_HOT_OFFERS": 2
      },
      "pricing": {
        "monthly": {
          "price": 0,
          "currency": "USD",
          "discount": 0,
          "billingCycle": {
            "_id": "cycle_id",
            "name": "monthly",
            "displayName": "Monthly",
            "durationInDays": 30
          }
        },
        "yearly": {
          "price": 0,
          "currency": "USD",
          "discount": 0,
          "billingCycle": {
            "_id": "cycle_id",
            "name": "yearly",
            "displayName": "Yearly",
            "durationInDays": 365
          }
        }
      },
      "billingCycles": [
        {
          "_id": "cycle_id",
          "name": "monthly",
          "displayName": "Monthly",
          "durationInDays": 30
        },
        {
          "_id": "cycle_id",
          "name": "yearly",
          "displayName": "Yearly",
          "durationInDays": 365
        }
      ]
    }
  ],
  "billingCycles": [
    {
      "_id": "cycle_id",
      "name": "monthly",
      "displayName": "Monthly",
      "durationInDays": 30
    },
    {
      "_id": "cycle_id",
      "name": "yearly",
      "displayName": "Yearly",
      "durationInDays": 365
    }
  ]
}
```

## Admin API Endpoints

### Plans Management

- `GET /api/subscriptions/admin/plans` - Get all plans (including inactive)
- `POST /api/subscriptions/admin/plans` - Create plan
- `PUT /api/subscriptions/admin/plans/:id` - Update plan
- `DELETE /api/subscriptions/admin/plans/:id` - Delete plan

### Plan Features Management

- `GET /api/subscriptions/admin/plans/:planId/features` - Get plan features
- `POST /api/subscriptions/admin/plans/:planId/features` - Add feature
- `PUT /api/subscriptions/admin/features/:featureId` - Update feature
- `DELETE /api/subscriptions/admin/features/:featureId` - Delete feature

### Plan Limits Management

- `GET /api/subscriptions/admin/plans/:planId/limits` - Get plan limits
- `POST /api/subscriptions/admin/plans/:planId/limits` - Set limit (upsert)
- `DELETE /api/subscriptions/admin/limits/:limitId` - Delete limit

### Billing Cycles Management

- `GET /api/subscriptions/admin/billing-cycles` - Get all billing cycles
- `POST /api/subscriptions/admin/billing-cycles` - Create billing cycle
- `PUT /api/subscriptions/admin/billing-cycles/:id` - Update billing cycle

### Pricing Management

- `GET /api/subscriptions/admin/plans/:planId/pricing` - Get plan pricing
- `POST /api/subscriptions/admin/plans/:planId/pricing` - Set pricing (upsert)
- `PUT /api/subscriptions/admin/pricing/:pricingId` - Update pricing

### Shop Subscriptions Management

- `GET /api/subscriptions/admin/shop-subscriptions` - Get all shop subscriptions
- `POST /api/subscriptions/admin/shop-subscriptions` - Create/Update shop subscription

## Shop Subscription Endpoint

### GET /api/subscriptions/shop

Get current shop's subscription with limits and usage (requires authentication).

**Response:**

```json
{
  "subscription": {
    "_id": "subscription_id",
    "shop": "shop_id",
    "subscriptionPlan": {
      "_id": "plan_id",
      "displayName": "Gold",
      "description": "Premium plan"
    },
    "billingCycle": {
      "_id": "cycle_id",
      "name": "monthly",
      "displayName": "Monthly",
      "durationInDays": 30
    },
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T00:00:00.000Z",
    "status": "active"
  },
  "limits": {
    "MAX_PRODUCTS": 100,
    "MAX_HOT_OFFERS": 10
  },
  "usage": {
    "MAX_PRODUCTS": 45,
    "MAX_HOT_OFFERS": 3
  }
}
```

## Usage Tracking Helpers

The controller exports helper functions for limit checking and usage tracking:

- `checkLimit(shopId, limitKey, increment = 0)` - Check if shop can perform action
- `incrementUsage(shopId, limitKey, amount = 1)` - Increment usage counter
- `decrementUsage(shopId, limitKey, amount = 1)` - Decrement usage counter

**Example usage in product controller:**

```javascript
const { checkLimit, incrementUsage } = require('../controllers/subscriptionController');

// Before creating product
const limitCheck = await checkLimit(shopId, 'MAX_PRODUCTS', 1);
if (!limitCheck.allowed) {
  return res.status(403).json({ message: limitCheck.reason });
}

// After creating product
await incrementUsage(shopId, 'MAX_PRODUCTS', 1);
```

## Important Notes

1. **Features are display-only**: They are shown on the frontend pricing page but are NOT used for enforcement
2. **Limits are for enforcement**: Use limit keys (e.g., `MAX_PRODUCTS`) to check and enforce restrictions
3. **One active subscription per shop**: The `ShopSubscription` model enforces this with a unique index on `shop`
4. **Usage tracking**: Use `SubscriptionUsage` to track current usage and avoid heavy queries
5. **Scheduled downgrades**: Shops can have a scheduled downgrade that takes effect on a future date

## Initialization

Run the billing cycles initialization script:

```bash
npm run init-billing-cycles
```

This creates the default monthly (30 days) and yearly (365 days) billing cycles.

