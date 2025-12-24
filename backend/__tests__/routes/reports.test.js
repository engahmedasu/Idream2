const request = require('supertest');
const app = require('../app');
const { createTestUser, generateAuthToken, createTestShop, createTestPermissions, createSuperAdmin } = require('../helpers/testHelpers');

describe('Report Routes', () => {
  let superAdmin, superAdminToken;
  let financeUser, financeToken;
  let testShop;

  beforeEach(async () => {
    // Create superAdmin (recreate before each test since afterEach clears DB)
    const admin = await createSuperAdmin();
    superAdmin = admin.user;
    superAdminToken = generateAuthToken(superAdmin._id);

    // Create Finance user with report.read permission
    const reportPermission = await createTestPermissions(['report.read']);
    financeUser = await createTestUser({
      email: 'finance@test.com',
      role: {
        name: 'Finance',
        permissions: reportPermission.map(p => p._id),
        isActive: true
      }
    });
    financeToken = generateAuthToken(financeUser.user._id);

    // Create test shop
    testShop = await createTestShop({
      createdBy: superAdmin._id
    });
  });

  describe('GET /api/reports/products', () => {
    it('should generate products report with report.read permission', async () => {
      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow Finance role to access products report', async () => {
      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${financeToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 403 without report.read permission', async () => {
      const noPermUser = await createTestUser();
      const noPermToken = generateAuthToken(noPermUser.user._id);

      const response = await request(app)
        .get('/api/reports/products')
        .set('Authorization', `Bearer ${noPermToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports/products');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/orders', () => {
    it('should generate orders report with report.read permission', async () => {
      const response = await request(app)
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow Finance role to access orders report', async () => {
      const response = await request(app)
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${financeToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/reports/shares', () => {
    it('should generate shares report with report.read permission', async () => {
      const response = await request(app)
        .get('/api/reports/shares')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
    });
  });
});

