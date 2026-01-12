# Database Migration Guide

This guide explains the database migrations needed after recent schema changes.

## Overview

Two migrations are required to update existing data to match the new schema:

1. **Product.productType**: Convert from String to Array
2. **OrderLog.orderNumber**: Add unique orderNumber to existing orders

## Migration 1: Convert Product.productType to Array

### What Changed
- **Before**: `productType` was a single string (e.g., `"Electronics"`)
- **After**: `productType` is now an array of strings (e.g., `["Electronics", "Gadgets"]`)

### Why Migration is Needed
Existing products in the database have `productType` as a string. The application now expects an array, which could cause errors when reading or updating products.

### How to Run

```bash
cd backend
npm run migrate-product-type-to-array
```

Or directly:
```bash
cd backend
node scripts/migrateProductTypeToArray.js
```

### What It Does
- Converts string values to single-element arrays: `"Electronics"` → `["Electronics"]`
- Converts empty strings to empty arrays: `""` → `[]`
- Converts null/undefined to empty arrays: `null` → `[]`
- Skips products that already have arrays

### Example Output
```
🔄 Starting migration: Converting productType from String to Array...

📋 Found 15 product(s) to process

   ✅ Updated product: Laptop (507f1f77bcf86cd799439011) - Converted "Electronics" to [Electronics]
   ✅ Updated product: Phone (507f1f77bcf86cd799439012) - Converted "Mobile" to [Mobile]
   ...

✅ Migration completed successfully!
```

---

## Migration 2: Add orderNumber to OrderLog

### What Changed
- **Before**: Orders did not have an `orderNumber` field
- **After**: All orders must have a unique `orderNumber` (numeric string based on Unix timestamp)

### Why Migration is Needed
- The `orderNumber` field has a `unique: true` constraint and is indexed
- Existing orders without `orderNumber` need to be populated before the unique index is enforced
- The Reports section displays order numbers, so all orders need this field

### How to Run

```bash
cd backend
npm run migrate-order-log-order-number
```

Or directly:
```bash
cd backend
node scripts/migrateOrderLogOrderNumber.js
```

### What It Does
- Generates unique numeric order numbers for all existing orders
- Uses Unix timestamp + random component to ensure uniqueness
- Creates/verifies the unique index on `orderNumber`
- Checks for duplicate order numbers

### Example Output
```
🔄 Starting migration: Adding orderNumber to existing OrderLog documents...

📋 Found 25 order(s) to process

   ℹ️  Found 0 existing orderNumbers

   ✅ Updated order: 507f1f77bcf86cd799439011 - Added orderNumber: 1767999045836
   ✅ Updated order: 507f1f77bcf86cd799439012 - Added orderNumber: 1767999045842
   ...

✅ Migration completed successfully!
```

---

## Running Both Migrations

You can run both migrations in sequence:

```bash
cd backend
npm run migrate-product-type-to-array
npm run migrate-order-log-order-number
```

## Important Notes

1. **Backup First**: Always backup your database before running migrations:
   ```bash
   mongodump --uri="mongodb://localhost:27017/idream" --out=./backup-$(date +%Y%m%d)
   ```

2. **Run in Order**: Run migrations in the order listed above (productType first, then orderNumber).

3. **Idempotent**: Both migrations are idempotent - you can run them multiple times safely. They will skip documents that already have the correct format.

4. **No Downtime Required**: These migrations can be run while the application is running, but it's recommended to run them during low-traffic periods.

5. **Verification**: Both scripts include verification steps to ensure the migration completed successfully.

## Troubleshooting

### Migration Fails with "Duplicate orderNumber"
- The script tries to generate unique order numbers, but if you have a very large number of orders, there's a small chance of collision
- The script will attempt to resolve this automatically
- If it persists, you may need to manually update the conflicting orders

### Products Still Show Errors After Migration
- Clear your application cache and restart the server
- Verify the migration completed by checking a few products in MongoDB:
  ```javascript
  db.products.findOne({}, { productType: 1 })
  ```
  Should show an array: `productType: ["Electronics"]` not `productType: "Electronics"`

### Orders Missing orderNumber After Migration
- Check if the migration script completed successfully
- Verify the OrderLog collection:
  ```javascript
  db.orderlogs.countDocuments({ orderNumber: { $exists: false } })
  ```
  Should return `0`

## Questions?

If you encounter any issues during migration, check:
1. MongoDB connection string in your `.env` file
2. Database permissions (read/write access)
3. Application logs for any errors

