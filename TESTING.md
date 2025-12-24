# Testing Guide - iDream Portal

This document provides a comprehensive guide to the test suite for the iDream Portal application.

## Overview

The iDream Portal test suite covers:
- **Backend API** - Express.js routes, controllers, models, and middleware
- **Frontend Admin Portal** - React components and pages
- **Frontend Portal** - User-facing React components

## Test Infrastructure

### Backend Testing
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: MongoDB Memory Server (in-memory MongoDB)
- **Coverage**: Jest coverage reports

### Frontend Testing
- **Framework**: Jest + React Testing Library
- **Environment**: jsdom (simulated browser)
- **Coverage**: Jest coverage reports

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm run test:auth
npm run test:shops
npm run test:products
npm run test:reports

# Run with coverage
npm test -- --coverage
```

### Frontend Tests (Admin Portal)

```bash
cd admin-portal

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Frontend Tests (Frontend Portal)

```bash
cd frontend-portal

# Run all tests
npm test

# Run in watch mode
npm run test:watch
```

## Test Coverage

### Backend Coverage

#### Routes (API Endpoints)
- ✅ Authentication routes (`/api/auth/*`)
  - Register
  - Login (email/phone)
  - Verify OTP
  - Get current user
- ✅ Shop routes (`/api/shops/*`)
  - List shops (with filters)
  - Get shop by ID
  - Create shop (with permissions)
  - Update shop (with permissions)
  - Delete shop (with permissions)
  - Activate shop
- ✅ Product routes (`/api/products/*`)
  - List products
  - Create product (with permissions)
  - Update product
  - Delete product
- ✅ Report routes (`/api/reports/*`)
  - Products report
  - Orders report
  - Shares report
  - Subscription logs report
  - Permission-based access (Finance role)

#### Middleware
- ✅ Authentication middleware (`auth`)
- ✅ Permission checking middleware (`checkPermission`)

#### Models
- ✅ User model validation
- ✅ Shop model validation
- ✅ Password hashing
- ✅ Field validation

### Frontend Coverage

#### Admin Portal Components
- ✅ Layout component (sidebar, navigation)
- ✅ Login page (form validation, submission)
- 🔄 Shop management (CRUD operations)
- 🔄 Product management (CRUD operations)
- 🔄 Role-based menu visibility

## Test Structure

### Backend Test Structure

```
backend/
├── __tests__/
│   ├── setup.js                 # Global test setup
│   ├── app.js                   # Express app for testing
│   ├── helpers/
│   │   └── testHelpers.js      # Reusable test utilities
│   ├── routes/
│   │   ├── auth.test.js        # Auth route tests
│   │   ├── shops.test.js       # Shop route tests
│   │   ├── products.test.js    # Product route tests
│   │   └── reports.test.js     # Report route tests
│   ├── middleware/
│   │   └── auth.test.js        # Middleware tests
│   └── models/
│       ├── user.test.js        # User model tests
│       └── shop.test.js        # Shop model tests
└── package.json
```

### Frontend Test Structure

```
admin-portal/src/
├── __tests__/
│   ├── components/
│   │   └── Layout.test.js      # Layout component tests
│   └── pages/
│       └── Login.test.js       # Login page tests
└── setupTests.js               # Test setup configuration
```

## Writing Tests

### Backend Test Example

```javascript
describe('POST /api/shops', () => {
  it('should create shop with valid permissions', async () => {
    const response = await request(app)
      .post('/api/shops')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Shop',
        email: 'shop@test.com'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('name', 'Test Shop');
  });
});
```

### Frontend Test Example

```javascript
describe('Login Page', () => {
  it('should submit login form', async () => {
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@test.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});
```

## Test Helpers

### Backend Helpers

Located in `backend/__tests__/helpers/testHelpers.js`:

- `createTestUser()` - Create test user with role
- `createTestRole()` - Create test role with permissions
- `createTestShop()` - Create test shop
- `createTestCategory()` - Create test category
- `generateAuthToken()` - Generate JWT token
- `createSuperAdmin()` - Create superAdmin user

### Usage Example

```javascript
const { createTestUser, generateAuthToken } = require('../helpers/testHelpers');

const { user } = await createTestUser({
  email: 'test@test.com',
  role: { name: 'testRole' }
});

const token = generateAuthToken(user._id);
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean Database**: Tests automatically clean up after each test
3. **Descriptive Names**: Use clear, descriptive test names
4. **AAA Pattern**: Arrange, Act, Assert
5. **Mock External Dependencies**: Mock API calls, file system, etc.
6. **Cover Edge Cases**: Test error conditions, validation, boundaries
7. **Maintain Test Data**: Use factories/helpers for test data

## Continuous Integration

Tests should run automatically on:
- Pull requests
- Before merging to main branch
- On push to main branch

## Coverage Goals

- **Backend**: >80% code coverage
- **Frontend**: >70% code coverage
- **Critical Paths**: 100% coverage (auth, payments, etc.)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Backend tests use MongoDB Memory Server (no external DB needed)
   - Ensure MongoDB Memory Server is properly installed

2. **Import Errors**
   - Check file paths in test files
   - Ensure all dependencies are installed

3. **Async/Await Issues**
   - Use `async/await` for async operations
   - Use `waitFor` for React Testing Library async assertions

4. **Mock Issues**
   - Clear mocks between tests with `jest.clearAllMocks()`
   - Reset mocks in `beforeEach` hooks

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [React Testing Library](https://testing-library.com/react)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

