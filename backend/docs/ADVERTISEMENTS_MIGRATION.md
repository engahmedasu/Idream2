# Advertisements Collection Migration Guide

## Overview

This migration script ensures the `advertisements` collection exists in MongoDB and has the correct indexes for optimal performance.

## Purpose

The migration script:
- Creates the `advertisements` collection if it doesn't exist
- Creates/verifies all required indexes
- Validates data integrity
- Provides statistics and summary

## Usage

Run the migration script using npm:

```bash
npm run migrate-advertisements
```

Or directly with Node.js:

```bash
node scripts/migrateAdvertisementsCollection.js
```

## Prerequisites

1. MongoDB must be running and accessible
2. Set `MONGODB_URI` in your `.env` file or use the default `mongodb://localhost:27017/idream`
3. The Advertisement model must be properly defined in `models/Advertisement.js`

## What the Migration Does

### 1. Collection Creation
- Checks if the `advertisements` collection exists
- Creates it automatically when the first document is inserted (MongoDB behavior)

### 2. Index Creation
The migration creates the following indexes for optimal query performance:

- **Compound Index: `categories_1_side_1_isActive_1`**
  - Optimizes queries filtering by category, side, and active status
  - Used by: `GET /api/advertisements/active?category=...&side=...`

- **Compound Index: `side_1_isActive_1`**
  - Optimizes queries filtering by side and active status
  - Used by: `GET /api/advertisements/active?side=...`

- **Compound Index: `startDate_1_endDate_1`**
  - Optimizes date range queries for scheduling
  - Used for filtering active advertisements within date ranges

- **Compound Index: `priority_-1_createdAt_-1`**
  - Optimizes sorting by priority and creation date
  - Used for displaying advertisements in order

### 3. Data Integrity Checks

The migration validates:
- Required fields: `image`, `categories`, `side`, `isActive`
- Valid side values: `left` or `right`
- At least one category assigned to each advertisement
- Valid date ranges (startDate <= endDate)
- Active advertisements within their date ranges
- Redirect URL presence

### 4. Statistics

The migration provides:
- Total advertisement count
- Distribution by side (left/right)
- Distribution by status (active/inactive)
- Distribution by category (top 10)
- Count of advertisements with redirect URLs

## Advertisement Schema

### Required Fields
- `image` (String): Path or URL to the advertisement image
- `categories` (Array of ObjectIds): Categories this advertisement targets
- `side` (String): Display side - `left` or `right`
- `isActive` (Boolean): Whether the advertisement is active

### Optional Fields
- `startDate` (Date): Optional start date for scheduling
- `endDate` (Date): Optional end date for scheduling
- `redirectUrl` (String): URL to redirect when advertisement is clicked
- `priority` (Number): Display priority (higher numbers appear first)
- `createdBy` (ObjectId): User who created the advertisement
- `updatedBy` (ObjectId): User who last updated the advertisement

### Timestamps
- `createdAt`: Automatically set when advertisement is created
- `updatedAt`: Automatically updated when advertisement is modified

## API Endpoints

### Public Endpoint
- **GET** `/api/advertisements/active`
  - Query parameters:
    - `category` (optional): Filter by category ID
    - `side` (optional): Filter by side (`left` or `right`)
  - Returns only active advertisements within their date ranges

### Admin Endpoints (Requires superAdmin role)
- **GET** `/api/advertisements` - List all advertisements
- **GET** `/api/advertisements/:id` - Get advertisement by ID
- **POST** `/api/advertisements` - Create new advertisement
- **PUT** `/api/advertisements/:id` - Update advertisement
- **DELETE** `/api/advertisements/:id` - Delete advertisement
- **PATCH** `/api/advertisements/:id/toggle-status` - Toggle active status

## Image Requirements

- **Formats**: JPG, PNG, WebP
- **Recommended Size**: 300×600 px minimum (vertical orientation)
- **Maximum File Size**: 5MB
- **Storage**: Images are stored in `uploads/advertisements/` directory

## Expected Output

When the migration runs successfully, you should see:

```
🔄 Starting Advertisements collection migration...

✅ Advertisements collection exists
   - Document count: X
   - Size: Y KB

📋 Creating/verifying indexes...

   ✅ Indexes verified/created

   Final indexes:
     - _id_: {"_id":1}
     - categories_1_side_1_isActive_1: {"categories":1,"side":1,"isActive":1}
     - side_1_isActive_1: {"side":1,"isActive":1}
     - startDate_1_endDate_1: {"startDate":1,"endDate":1}
     - priority_-1_createdAt_-1: {"priority":-1,"createdAt":-1}

🔍 Checking data integrity...

   ✅ Schema structure is correct
   ✅ All side values are valid
   ✅ All advertisements have at least one category
   ✅ All date ranges are valid

   📊 Active advertisements: X
   📊 Side distribution:
     - left: X
     - right: Y
   📊 Status distribution:
     - active: X
     - inactive: Y

============================================================
📊 Migration Summary:
============================================================
   Collection exists: Yes
   Total advertisements: X
   Indexes created: 5
============================================================

✅ Migration completed successfully!
```

## Troubleshooting

### Collection Not Created
- This is normal if no advertisements exist yet
- The collection will be created automatically when the first advertisement is inserted

### Index Creation Warnings
- If you see warnings about index creation, they will be created automatically on first insert
- This is expected behavior for empty collections

### Invalid Data Warnings
- Review any warnings about invalid data
- Fix invalid advertisements through the admin portal
- Re-run the migration to verify fixes

## Next Steps

After running the migration:

1. **Create Advertisements**: Use the admin portal to create advertisements
   - Navigate to: Admin Portal → Advertisements
   - Click "Create Advertisement"
   - Upload image, select categories, side, and configure settings

2. **Verify Display**: Check that advertisements appear correctly on the frontend
   - Visit category pages to see category-specific advertisements
   - Verify left and right side placement
   - Test click-through functionality if redirect URLs are set

3. **Monitor Performance**: Use MongoDB indexes to monitor query performance
   - Check slow query logs if needed
   - Verify indexes are being used with `explain()` queries

## Related Documentation

- [Advertisement Model](../models/Advertisement.js)
- [Advertisement Controller](../controllers/advertisementController.js)
- [Advertisement Routes](../routes/advertisements.js)
- [Business Requirements Document](../../business_requirements_document_advertisement_area.md)
