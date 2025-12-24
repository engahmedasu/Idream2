const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { createTestUser, generateAuthToken, createSuperAdmin } = require('../helpers/testHelpers');
const User = require('../../models/User');
const Role = require('../../models/Role');

describe('Authentication Routes', () => {
  let guestRole;

  beforeAll(async () => {
    // Create guest role for tests
    guestRole = await Role.create({
      name: 'guest',
      description: 'Guest user',
      isActive: true,
      permissions: []
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          phone: '1234567890',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');

      // Verify user was created
      const user = await User.findOne({ email: 'newuser@test.com' });
      expect(user).toBeTruthy();
      expect(user.role.toString()).toBe(guestRole._id.toString());
      expect(user.isEmailVerified).toBe(false);
    });

    it('should return 400 if email already exists', async () => {
      await User.create({
        email: 'existing@test.com',
        phone: '1111111111',
        password: 'password123',
        role: guestRole._id,
        isEmailVerified: false
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          phone: '2222222222',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@test.com',
        phone: '9999999999',
        password: 'password123',
        isEmailVerified: true
      });
    });

    it('should login successfully with email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@test.com');
    });

    it('should login successfully with phone', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '9999999999',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if credentials are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser, token;

    beforeEach(async () => {
      const result = await createTestUser({
        email: 'me@test.com',
        isEmailVerified: true
      });
      testUser = result.user;
      token = generateAuthToken(testUser._id);
    });

    it('should return current user when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'me@test.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});

