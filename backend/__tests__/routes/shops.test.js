const request = require('supertest');
const app = require('../app');
const { createTestUser, generateAuthToken, createTestShop, createTestCategory, createTestPermissions, createSuperAdmin } = require('../helpers/testHelpers');
const Shop = require('../../models/Shop');

describe('Shop Routes', () => {
  let superAdmin, superAdminToken;
  let testUser, testUserToken;
  let testShop;
  let testCategory;

  beforeEach(async () => {
    // Create test category (recreate before each test since afterEach clears DB)
    testCategory = await createTestCategory();

    // Create superAdmin (recreate before each test since afterEach clears DB)
    const admin = await createSuperAdmin();
    superAdmin = admin.user;
    superAdminToken = generateAuthToken(superAdmin._id);

    // Create test user with shop permissions
    const shopPermissions = await createTestPermissions([
      'shop.create', 'shop.read', 'shop.update', 'shop.delete'
    ]);
    
    testUser = await createTestUser({
      role: {
        name: 'testRole',
        permissions: shopPermissions.map(p => p._id),
        isActive: true
      }
    });
    testUserToken = generateAuthToken(testUser.user._id);

    // Create test shop
    testShop = await createTestShop({
      createdBy: superAdmin._id,
      category: testCategory._id
    });
  });

  describe('GET /api/shops', () => {
    it('should get all shops without authentication', async () => {
      const response = await request(app)
        .get('/api/shops');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter shops by category', async () => {
      const response = await request(app)
        .get(`/api/shops?category=${testCategory._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter shops by active status', async () => {
      const response = await request(app)
        .get('/api/shops?isActive=true');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/shops/:id', () => {
    it('should get shop by ID', async () => {
      const response = await request(app)
        .get(`/api/shops/${testShop._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body._id).toBe(testShop._id.toString());
    });

    it('should return 404 for non-existent shop', async () => {
      const mongoose = require('mongoose');
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/shops/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/shops', () => {
    it('should create shop with valid permissions', async () => {
      const newShop = {
        name: 'New Test Shop',
        email: 'newshop@test.com',
        mobile: '9876543210',
        whatsapp: '9876543210',
        address: '456 Test Avenue',
        category: testCategory._id
      };

      const response = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newShop);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'New Test Shop');
    });

    it('should return 403 without shop.create permission', async () => {
      const noPermUser = await createTestUser();
      const noPermToken = generateAuthToken(noPermUser.user._id);

      const response = await request(app)
        .post('/api/shops')
        .set('Authorization', `Bearer ${noPermToken}`)
        .send({
          name: 'Unauthorized Shop',
          email: 'unauth@test.com'
        });

      expect(response.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/shops')
        .send({
          name: 'Test Shop'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/shops/:id', () => {
    it('should update shop with valid permissions', async () => {
      const updateData = {
        name: 'Updated Shop Name'
      };

      const response = await request(app)
        .put(`/api/shops/${testShop._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Shop Name');
    });

    it('should return 403 without shop.update permission', async () => {
      const noPermUser = await createTestUser();
      const noPermToken = generateAuthToken(noPermUser.user._id);

      const response = await request(app)
        .put(`/api/shops/${testShop._id}`)
        .set('Authorization', `Bearer ${noPermToken}`)
        .send({ name: 'Unauthorized Update' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/shops/:id', () => {
    it('should delete shop with valid permissions', async () => {
      const shopToDelete = await createTestShop({
        createdBy: superAdmin._id,
        category: testCategory._id
      });

      const response = await request(app)
        .delete(`/api/shops/${shopToDelete._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);

      // Verify shop is deleted
      const deletedShop = await Shop.findById(shopToDelete._id);
      expect(deletedShop).toBeNull();
    });

    it('should return 403 without shop.delete permission', async () => {
      const noPermUser = await createTestUser();
      const noPermToken = generateAuthToken(noPermUser.user._id);

      const response = await request(app)
        .delete(`/api/shops/${testShop._id}`)
        .set('Authorization', `Bearer ${noPermToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/shops/:id/activate', () => {
    it('should activate shop with valid permissions', async () => {
      const inactiveShop = await createTestShop({
        isActive: false,
        isApproved: false,
        createdBy: superAdmin._id,
        category: testCategory._id
      });

      const response = await request(app)
        .patch(`/api/shops/${inactiveShop._id}/activate`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('isApproved', true);
    });
  });
});

