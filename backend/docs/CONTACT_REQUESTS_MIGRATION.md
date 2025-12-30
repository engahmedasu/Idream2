# Contact Requests Collection Migration Guide

## Overview

This migration script ensures the Contact Requests collection is properly set up with all required indexes and validates data integrity.

## What the Migration Does

1. **Verifies Collection Exists**: Checks if the `contactrequests` collection exists in the database
2. **Creates Indexes**: Ensures all required indexes are created:
   - Compound index on `status` and `createdAt` (optimizes queries by status)
   - Compound index on `isRead` and `createdAt` (optimizes unread queries)
3. **Validates Data Integrity**: 
   - Checks for required fields (name, email, service, message, status)
   - Validates status values (new, read, replied, archived)
   - Validates email format
   - Shows status distribution statistics
4. **Provides Summary**: Shows collection stats and migration results

## Running the Migration

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run migrate-contact-requests
```

### Option 2: Direct node command

```bash
cd backend
node scripts/migrateContactRequestsCollection.js
```

## Expected Output

When successful, you should see:

```
✅ MongoDB connected

🔄 Starting Contact Requests collection migration...

✅ Contact Requests collection exists
   - Document count: 0
   - Size: N/A

📋 Creating/verifying indexes...

   Existing indexes:
     - _id_: {"_id":1}
     - status_1_createdAt_-1: {"status":1,"createdAt":-1}
     - isRead_1_createdAt_-1: {"isRead":1,"createdAt":-1}

   ✅ Indexes verified/created

   Final indexes:
     - _id_: {"_id":1}
     - status_1_createdAt_-1: {"status":1,"createdAt":-1}
     - isRead_1_createdAt_-1: {"isRead":1,"createdAt":-1}

🔍 Checking data integrity...

   ℹ️  No contact requests found. Schema will be validated when first request is created.

============================================================
📊 Migration Summary:
============================================================
   Collection exists: Yes
   Total requests: 0
   Indexes created: 3
============================================================

✅ Migration completed successfully!
```

## When to Run This Migration

- **After deploying the Contact Us feature** for the first time
- **After updating the ContactRequest model** with new indexes
- **To verify database integrity** after manual data changes
- **As part of deployment process** to ensure indexes are up-to-date

## Indexes Created

### 1. Compound Index on `status` and `createdAt`
- **Purpose**: Optimizes queries that filter by status and sort by date
- **Type**: Compound index
- **Usage**: Used when fetching requests by status (new, read, replied, archived)

### 2. Compound Index on `isRead` and `createdAt`
- **Purpose**: Optimizes queries for unread requests
- **Type**: Compound index
- **Usage**: Used when filtering unread requests and sorting by date

## Schema Validation

The migration validates:
- ✅ Required fields: name, email, service, message, status
- ✅ Status values: must be one of (new, read, replied, archived)
- ✅ Email format: must be valid email address
- ✅ Data types: ensures all fields have correct types

## Troubleshooting

### Issue: "Collection does not exist"
**Solution**: This is normal if no contact requests have been created yet. The collection will be created automatically when the first request is submitted.

### Issue: "Invalid status values found"
**Solution**: Review the requests manually and update status values to valid ones (new, read, replied, archived).

### Issue: "Invalid email format"
**Solution**: Review and fix email addresses in the database. Invalid emails may cause issues with email notifications.

## Related Commands

- **View contact requests**: Access via admin portal → Pages → Contact Requests
- **Submit contact request**: Users can submit via frontend Contact Us modal
- **API endpoint**: `POST /api/contact` (public), `GET /api/contact` (admin)

## Notes

- The migration is **idempotent** - safe to run multiple times
- It will not modify existing data, only verify and create indexes
- Indexes are automatically maintained by MongoDB
- The collection name in MongoDB is `contactrequests` (lowercase, no spaces)

## API Endpoints

### Public Endpoints
- `POST /api/contact` - Submit a contact request

### Admin Endpoints (Requires superAdmin role)
- `GET /api/contact` - Get all contact requests (with pagination, filters)
- `GET /api/contact/stats` - Get statistics
- `GET /api/contact/:id` - Get contact request by ID
- `PATCH /api/contact/:id/read` - Mark as read
- `PATCH /api/contact/:id/status` - Update status
- `DELETE /api/contact/:id` - Delete contact request

## Example Contact Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "service": "Marketing",
  "message": "I'm interested in your marketing services."
}
```

## Status Flow

1. **new** - Initial status when request is submitted
2. **read** - Admin has viewed the request
3. **replied** - Admin has responded to the request
4. **archived** - Request is archived (no longer active)

