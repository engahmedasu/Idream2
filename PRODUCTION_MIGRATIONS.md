# Production Database Migration Guide

This document lists all migration scripts that should be run on the production database, in the recommended order.

## ⚠️ Important Notes

1. **Backup First**: Always backup your production database before running migrations
2. **Test in Staging**: Test all migrations in a staging environment first
3. **Run During Maintenance Window**: Schedule migrations during low-traffic periods
4. **Monitor**: Watch for errors and verify data integrity after each migration
5. **One at a Time**: Run migrations sequentially, not in parallel

## Migration Scripts Execution Order

### 1. Core System Initialization (Run Once - If Not Already Done)

These scripts initialize core system collections and should be run first if setting up a new production environment:

```bash
# Initialize subscription system (billing cycles, plans, etc.)
npm run init-subscription-system

# Initialize billing cycles
npm run init-billing-cycles

# Initialize subscription logs collection
npm run init-subscription-logs

# Initialize videos collection
npm run init-videos

# Initialize pages collection
npm run init-pages
```

### 2. Schema Migrations (Run Once - If Not Already Done)

These migrations update existing collections with new fields or structures:

```bash
# Migrate product types to array format
npm run migrate-product-type-to-array

# Add product limits to subscription plans
npm run add-product-limits

# Add pricing to subscription plans
npm run add-pricing-to-plans

# Add website field to shops
npm run add-website-to-shops

# Migrate pages collection (if pages feature was added)
npm run migrate-pages

# Add allowedCategories field to User model (for MallAdmin category restrictions)
npm run add-allowed-categories-to-users
```

### 3. New Feature Migrations (Recent Additions)

These are the latest migrations for new features:

```bash
# Migrate contact requests collection
npm run migrate-contact-requests

# Migrate requests collection (Join Our Team, New Ideas, Hire Expert)
npm run migrate-requests

# Migrate advertisements collection (Advertisement Area Feature)
npm run migrate-advertisements

# Add allowedCategories field to User model (MallAdmin category restrictions - LATEST)
npm run add-allowed-categories-to-users
```

### 4. Data Integrity Migrations

These migrations fix data issues or update existing records:

```bash
# Migrate order log order numbers
npm run migrate-order-log-order-number

# Verify roles and permissions
npm run verify-roles
```

### 5. Data Updates (Optional - As Needed)

These scripts update existing data and can be run multiple times:

```bash
# Update shops priority
npm run update-shops-priority

# Update shipping fees
npm run update-shipping-fees

# Update categories icons
npm run update-categories-icon

# Update users activation status
npm run update-users-activation
```

## Quick Production Migration Checklist

For a **fresh production deployment** or **major update**, run these in order:

```bash
# 1. Core System
npm run init-subscription-system
npm run init-billing-cycles
npm run init-subscription-logs
npm run init-videos
npm run init-pages

# 2. Schema Updates
npm run migrate-product-type-to-array
npm run add-product-limits
npm run add-pricing-to-plans
npm run add-website-to-shops
npm run migrate-pages

# 3. New Features
npm run migrate-contact-requests
npm run migrate-requests
npm run migrate-advertisements
npm run add-allowed-categories-to-users

# 4. Data Integrity
npm run migrate-order-log-order-number
npm run verify-roles
```

## For Incremental Updates (Only New Features)

If you're just adding new features to an existing production database:

```bash
# Only run the new feature migrations
npm run migrate-advertisements  # Advertisement Area Feature
npm run add-allowed-categories-to-users  # LATEST: MallAdmin category restrictions
```

## Migration Scripts Details

### add-allowed-categories-to-users
- **Purpose**: Adds `allowedCategories` field to User model for MallAdmin category restrictions
- **When to Run**: When deploying the MallAdmin category restriction feature
- **Impact**: Adds new field to existing User documents (sets to empty array `[]`)
- **Safe to Re-run**: Yes (idempotent)
- **Description**: This migration adds the `allowedCategories` field to all User documents. Existing users will have an empty array `[]`, while new MallAdmin users can have categories assigned via the Admin Portal. This enables category-based access control for MallAdmin users.

### migrate-advertisements
- **Purpose**: Creates advertisements collection and indexes
- **When to Run**: When deploying the Advertisement Area feature
- **Impact**: Creates new collection, no data modification
- **Safe to Re-run**: Yes (idempotent)

### migrate-requests
- **Purpose**: Creates requests collection for Join Our Team, New Ideas, Hire Expert
- **When to Run**: When deploying the Requests feature
- **Impact**: Creates new collection, no data modification
- **Safe to Re-run**: Yes (idempotent)

### migrate-contact-requests
- **Purpose**: Creates contact requests collection
- **When to Run**: When deploying contact form feature
- **Impact**: Creates new collection, no data modification
- **Safe to Re-run**: Yes (idempotent)

### migrate-pages
- **Purpose**: Creates pages collection for CMS functionality
- **When to Run**: When deploying pages feature
- **Impact**: Creates new collection, no data modification
- **Safe to Re-run**: Yes (idempotent)

### migrate-product-type-to-array
- **Purpose**: Converts productType from string to array
- **When to Run**: One-time migration for product type structure
- **Impact**: Modifies existing product documents
- **Safe to Re-run**: Yes (checks before converting)

### migrate-order-log-order-number
- **Purpose**: Adds orderNumber field to order logs
- **When to Run**: One-time migration for order tracking
- **Impact**: Modifies existing order log documents
- **Safe to Re-run**: Yes (checks before adding)

## Pre-Migration Checklist

Before running migrations on production:

- [ ] Database backup completed
- [ ] Staging environment tested with same migrations
- [ ] Maintenance window scheduled
- [ ] Team notified of maintenance
- [ ] Rollback plan prepared
- [ ] MongoDB connection verified
- [ ] Environment variables set correctly
- [ ] Sufficient disk space available

## Post-Migration Verification

After running migrations:

- [ ] Check migration script output for errors
- [ ] Verify collections exist and have correct indexes
- [ ] Test application functionality
- [ ] Check database size and performance
- [ ] Monitor application logs for errors
- [ ] Verify data integrity

## Running Migrations

### Using npm scripts (Recommended)

```bash
cd backend
npm run add-allowed-categories-to-users  # Latest migration
```

### Direct Node execution

```bash
cd backend
node scripts/addAllowedCategoriesToUsers.js
```

### With environment variables

```bash
cd backend
MONGODB_URI="mongodb://your-production-uri" node scripts/addAllowedCategoriesToUsers.js
```

## Troubleshooting

### Migration fails with connection error
- Verify MongoDB is running and accessible
- Check MONGODB_URI environment variable
- Verify network connectivity

### Migration reports warnings
- Review warnings in migration output
- Most warnings are informational and safe to ignore
- Check data integrity if concerned

### Need to rollback
- Restore from backup
- Most migrations are additive (create collections/indexes)
- Data modification migrations should be tested in staging first

## Support

For issues or questions about migrations:
1. Check the migration script output for detailed error messages
2. Review the migration script source code for details
3. Check MongoDB logs for database-level errors
4. Verify environment configuration matches staging
