const request = require('supertest');
const app = require('../app');
const { createTestUser, generateAuthToken, createTestShop, createTestCategory, createTestPermissions, createSuperAdmin } = require('../helpers/testHelpers');
const Product = require('../../models/Product');

describe('Product Routes', () => {
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

    // Create test shop
    testShop = await createTestShop({
      createdBy: superAdmin._id,
      category: testCategory._id
    });

    // Create test user with product permissions
    const productPermissions = await createTestPermissions([
      'product.create', 'product.read', 'product.update', 'product.delete'
    ]);
    
    testUser = await createTestUser({
      role: {
        name: 'productUser',
        permissions: productPermissions.map(p => p._id),
        isActive: true
      },
      shop: testShop._id
    });
    testUserToken = generateAuthToken(testUser.user._id);
  });

  describe('GET /api/products', () => {
    it('should get all products without authentication', async () => {
      const response = await request(app)
        .get('/api/products');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter products by shop', async () => {
      const response = await request(app)
        .get(`/api/products?shop=${testShop._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with valid permissions', async () => {
      const newProduct = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        shop: testShop._id,
        category: testCategory._id,
        image: '/uploads/products/test-image.jpg', // Required field
        isActive: true,
        isApproved: true
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Test Product');
    });

    it('should return 403 without product.create permission', async () => {
      const noPermUser = await createTestUser();
      const noPermToken = generateAuthToken(noPermUser.user._id);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${noPermToken}`)
        .send({
          name: 'Unauthorized Product',
          shop: testShop._id
        });

      expect(response.status).toBe(403);
    });
  });
});

