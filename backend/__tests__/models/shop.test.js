const Shop = require('../../models/Shop');
const Category = require('../../models/Category');
const User = require('../../models/User');
const Role = require('../../models/Role');

describe('Shop Model', () => {
  let testCategory, testUser;

  beforeAll(async () => {
    testCategory = await Category.create({
      name: 'Test Category',
      icon: '/test-icon.png',
      isActive: true
    });

    const testRole = await Role.create({
      name: 'testRole',
      description: 'Test Role',
      isActive: true,
      permissions: []
    });

    testUser = await User.create({
      email: 'shopowner@test.com',
      password: 'password123',
      phone: '1234567890',
      role: testRole._id
    });
  });

  it('should create a shop with all required fields', async () => {
    const shopData = {
      name: 'Test Shop',
      email: 'shop@test.com',
      mobile: '1234567890',
      whatsapp: '1234567890',
      address: '123 Test Street',
      category: testCategory._id,
      createdBy: testUser._id
    };

    const shop = await Shop.create(shopData);
    expect(shop).toBeDefined();
    expect(shop.name).toBe('Test Shop');
    expect(shop.email).toBe('shop@test.com');
  });

  it('should have default values for optional fields', async () => {
    const shopData = {
      name: 'Default Shop',
      email: 'default@test.com',
      mobile: '1234567890',
      whatsapp: '1234567890',
      category: testCategory._id,
      createdBy: testUser._id
    };

    const shop = await Shop.create(shopData);
    expect(shop.isActive).toBe(false);
    expect(shop.isApproved).toBe(false);
    expect(shop.priority).toBe(0);
  });

  it('should require name field', async () => {
    const shopData = {
      email: 'noname@test.com',
      mobile: '1234567890',
      whatsapp: '1234567890',
      category: testCategory._id,
      createdBy: testUser._id
    };

    await expect(Shop.create(shopData)).rejects.toThrow();
  });

  it('should require email field', async () => {
    const shopData = {
      name: 'No Email Shop',
      mobile: '1234567890',
      whatsapp: '1234567890',
      category: testCategory._id,
      createdBy: testUser._id
    };

    await expect(Shop.create(shopData)).rejects.toThrow();
  });

  it('should require category field', async () => {
    const shopData = {
      name: 'No Category Shop',
      email: 'nocat@test.com',
      mobile: '1234567890',
      whatsapp: '1234567890',
      createdBy: testUser._id
    };

    await expect(Shop.create(shopData)).rejects.toThrow();
  });
});

