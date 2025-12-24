# Backend Test Suite

This directory contains comprehensive tests for the iDream backend API.

## Test Setup

The test suite uses:
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion library for API testing
- **MongoDB Memory Server** - In-memory MongoDB instance for testing

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test files
```bash
# Auth tests
npm run test:auth

# Shop tests
npm run test:shops

# Product tests
npm run test:products

# Report tests
npm run test:reports
```

### Run with coverage
```bash
npm test -- --coverage
```

## Test Structure

```
__tests__/
├── setup.js                 # Global test setup and teardown
├── app.js                   # Express app instance for testing
├── helpers/
│   └── testHelpers.js      # Reusable test helper functions
├── routes/
│   ├── auth.test.js        # Authentication route tests
│   ├── shops.test.js       # Shop route tests
│   ├── products.test.js    # Product route tests
│   └── reports.test.js     # Report route tests
├── middleware/
│   └── auth.test.js        # Authentication middleware tests
└── models/
    ├── user.test.js        # User model tests
    └── shop.test.js        # Shop model tests
```

## Test Coverage

### Routes Tests
- ✅ Authentication (register, login, verify OTP)
- ✅ Shops (CRUD operations, permissions)
- ✅ Products (CRUD operations, permissions)
- ✅ Reports (access control, Finance role)

### Middleware Tests
- ✅ Authentication middleware
- ✅ Permission checking middleware

### Model Tests
- ✅ User model validation
- ✅ Shop model validation

## Test Helpers

The `testHelpers.js` file provides utility functions:
- `createTestUser()` - Create test users with roles
- `createTestRole()` - Create test roles with permissions
- `createTestShop()` - Create test shops
- `generateAuthToken()` - Generate JWT tokens for testing
- `createSuperAdmin()` - Create superAdmin user for tests

## Writing New Tests

When adding new tests:

1. Place route tests in `__tests__/routes/`
2. Place model tests in `__tests__/models/`
3. Place middleware tests in `__tests__/middleware/`
4. Use helper functions from `testHelpers.js`
5. Clean up test data in `afterEach` hooks (handled automatically by setup.js)

## Environment Variables

Tests use the following environment variables (set in `setup.js`):
- `JWT_SECRET` - JWT secret for token generation
- `JWT_EXPIRE` - JWT expiration time
- `NODE_ENV` - Set to 'test'

## Database

Tests use MongoDB Memory Server, which:
- Runs in-memory (no external MongoDB required)
- Is automatically cleaned after each test
- Is isolated per test run

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Tests automatically clean up via `setup.js`
3. **Mocking**: Use real database (MongoDB Memory Server) for integration tests
4. **Assertions**: Use descriptive test names and clear assertions
5. **Coverage**: Aim for >80% code coverage

