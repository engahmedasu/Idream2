# Pages Collection Migration Guide

## Overview

This migration script ensures the Pages collection is properly set up with all required indexes and validates data integrity.

## What the Migration Does

1. **Verifies Collection Exists**: Checks if the `pages` collection exists in the database
2. **Creates Indexes**: Ensures all required indexes are created:
   - Unique index on `slug` field (prevents duplicate slugs)
   - Compound index on `isActive` and `order` (optimizes queries for active pages)
3. **Validates Data Integrity**: 
   - Checks for duplicate slugs
   - Verifies schema structure
   - Validates bilingual fields (title.en, title.ar, content.en, content.ar)
4. **Provides Summary**: Shows collection stats and migration results

## Running the Migration

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run migrate-pages
```

### Option 2: Direct node command

```bash
cd backend
node scripts/migratePagesCollection.js
```

## Expected Output

When successful, you should see:

```
✅ MongoDB connected

🔄 Starting Pages collection migration...

✅ Pages collection exists
   - Document count: 5
   - Size: 2.19 KB

📋 Creating/verifying indexes...

   Existing indexes:
     - _id_: {"_id":1}
     - slug_1: {"slug":1}
     - isActive_1_order_1: {"isActive":1,"order":1}

   ✅ Indexes verified/created

   Final indexes:
     - _id_: {"_id":1}
     - slug_1: {"slug":1} (unique)
     - isActive_1_order_1: {"isActive":1,"order":1}

🔍 Checking data integrity...

   ✅ No duplicate slugs found

📐 Verifying schema structure...

   ✅ Schema structure is correct
   ✅ Bilingual title structure is correct
   ✅ Bilingual content structure is correct

============================================================
📊 Migration Summary:
============================================================
   Collection exists: Yes
   Total pages: 5
   Indexes created: 3
   Data integrity: OK
============================================================

✅ Migration completed successfully!
```

## When to Run This Migration

- **After deploying the Pages feature** for the first time
- **After updating the Page model** with new indexes
- **To verify database integrity** after manual data changes
- **As part of deployment process** to ensure indexes are up-to-date

## Indexes Created

### 1. Unique Index on `slug`
- **Purpose**: Ensures no two pages can have the same slug
- **Type**: Unique index
- **Automatic**: Created by Mongoose when `unique: true` is set in schema

### 2. Compound Index on `isActive` and `order`
- **Purpose**: Optimizes queries that filter by `isActive` and sort by `order`
- **Type**: Compound index
- **Usage**: Used when fetching active pages in order (e.g., for footer links)

## Troubleshooting

### Issue: "Collection does not exist"
**Solution**: This is normal if no pages have been created yet. The collection will be created automatically when the first page is inserted.

### Issue: "Duplicate slugs found"
**Solution**: Review the pages manually and ensure each page has a unique slug. You can update slugs via the admin portal.

### Issue: "Missing bilingual fields"
**Solution**: Ensure all pages have both English and Arabic versions of title and content. Update pages via the admin portal.

## Related Commands

- **Seed initial pages**: `npm run init-pages`
- **View pages**: Access via admin portal → Pages section
- **Create/Edit pages**: Use the admin portal Pages management interface

## Notes

- The migration is **idempotent** - safe to run multiple times
- It will not modify existing data, only verify and create indexes
- Indexes are automatically maintained by MongoDB
- The unique index on `slug` prevents duplicate slugs at the database level

