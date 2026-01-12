# Requests Collection Migration Guide

## Overview

This migration script ensures the Requests collection is properly set up with all required indexes and validates data integrity. The Requests collection handles three types of requests:
- **Join Our Team**: Job application requests
- **New Ideas**: Startup/product idea submissions
- **Hire Expert**: Expert hiring requests

## What the Migration Does

1. **Verifies Collection Exists**: Checks if the `requests` collection exists in the database
2. **Creates Indexes**: Ensures all required indexes are created:
   - Compound index on `type` and `createdAt` (optimizes queries by request type)
   - Compound index on `status` and `createdAt` (optimizes queries by status)
   - Compound index on `isRead` and `createdAt` (optimizes unread queries)
   - Index on `email` (optimizes email-based searches)
3. **Validates Data Integrity**: 
   - Checks for required fields (type, fullName, email, status)
   - Validates type values (join-our-team, new-ideas, hire-expert)
   - Validates status values (new, read, replied, archived)
   - Validates email format
   - Shows type and status distribution statistics
4. **Provides Summary**: Shows collection stats and migration results

## Running the Migration

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run migrate-requests
```

### Option 2: Direct node command

```bash
cd backend
node scripts/migrateRequestsCollection.js
```

## Expected Output

When successful, you should see:

```
✅ MongoDB connected

🔄 Starting Requests collection migration...

📝 Requests collection does not exist. It will be created when first document is inserted.

📋 Creating/verifying indexes...

   ✅ Indexes verified/created

   Final indexes:
     - _id_: {"_id":1}
     - type_1_createdAt_-1: {"type":1,"createdAt":-1}
     - status_1_createdAt_-1: {"status":1,"createdAt":-1}
     - isRead_1_createdAt_-1: {"isRead":1,"createdAt":-1}
     - email_1: {"email":1}

🔍 Checking data integrity...

   ℹ️  No requests found. Schema will be validated when first request is created.

============================================================
📊 Migration Summary:
============================================================
   Collection exists: Will be created on first insert
   Total requests: 0
   Indexes created: 5
============================================================

✅ Migration completed successfully!

📝 Notes:
   - Index on "type" and "createdAt" optimizes type-based queries
   - Index on "status" and "createdAt" optimizes status queries
   - Index on "isRead" and "createdAt" optimizes unread queries
   - Index on "email" optimizes email-based searches
   - All indexes are automatically maintained by MongoDB
   - Requests can be submitted via: POST /api/requests
   - Admin can view requests at: Admin Portal → Requests

🔌 MongoDB connection closed
```

## Request Types and Fields

### Join Our Team (`join-our-team`)
- **Required Fields**: fullName, email, positionOfInterest, coverLetter
- **Optional Fields**: companyName, serviceNeeded, projectDetails

### New Ideas (`new-ideas`)
- **Required Fields**: fullName, email, ideaTitle, briefIdeaDescription
- **Optional Fields**: positionOfInterest, coverLetter, companyName, serviceNeeded, projectDetails

### Hire Expert (`hire-expert`)
- **Required Fields**: fullName, email, serviceNeeded, projectDetails
- **Optional Fields**: companyName, positionOfInterest, coverLetter, ideaTitle, briefIdeaDescription

## Status Values

- **new**: Newly submitted request (default)
- **read**: Request has been viewed by admin
- **replied**: Admin has replied to the request
- **archived**: Request has been archived

## API Endpoints

### Public Endpoints
- `POST /api/requests` - Submit a new request

### Admin Endpoints (Requires superAdmin role)
- `GET /api/requests` - Get all requests (supports query params: type, status, isRead, search, page, limit)
- `GET /api/requests/stats` - Get statistics (supports query param: type)
- `GET /api/requests/:id` - Get request by ID
- `PATCH /api/requests/:id/read` - Mark request as read
- `PATCH /api/requests/:id/status` - Update request status
- `DELETE /api/requests/:id` - Delete request

## When to Run This Migration

- **First Time Setup**: Run before deploying the Requests feature
- **After Schema Changes**: If you modify the Request model schema
- **After Index Changes**: If you add or modify indexes in the Request model
- **Data Validation**: To check data integrity of existing requests

## Troubleshooting

### Collection Already Exists
If the collection already exists, the migration will:
- Verify existing indexes
- Check data integrity
- Report any issues found

### Missing Indexes
If indexes are missing, the migration will create them automatically.

### Invalid Data
If invalid data is found (invalid types, statuses, or email formats), the migration will report warnings but won't modify the data. You'll need to fix invalid data manually.

## Related Files

- **Model**: `backend/models/Request.js`
- **Controller**: `backend/controllers/requestController.js`
- **Routes**: `backend/routes/requests.js`
- **Migration Script**: `backend/scripts/migrateRequestsCollection.js`

## Notes

- The collection name in MongoDB is `requests` (lowercase)
- Indexes are automatically maintained by MongoDB
- The migration is safe to run multiple times (idempotent)
- The migration will not delete or modify existing data
