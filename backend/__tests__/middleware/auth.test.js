const jwt = require('jsonwebtoken');
const { auth, checkPermission } = require('../../middleware/auth');
const { createTestUser, generateAuthToken, createTestPermissions, createSuperAdmin } = require('../helpers/testHelpers');
const User = require('../../models/User');

describe('Authentication Middleware', () => {
  describe('auth middleware', () => {
    it('should authenticate valid token', async () => {
      const { user } = await createTestUser();
      const token = generateAuthToken(user._id);

      const req = {
        header: jest.fn().mockReturnValue(`Bearer ${token}`)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await auth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
    });

    it('should reject request without token', async () => {
      const req = {
        header: jest.fn().mockReturnValue(undefined)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const req = {
        header: jest.fn().mockReturnValue('Bearer invalid-token')
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for inactive user', async () => {
      const { user } = await createTestUser({ isActive: false });
      const token = generateAuthToken(user._id);

      const req = {
        header: jest.fn().mockReturnValue(`Bearer ${token}`)
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkPermission middleware', () => {
    it('should allow access with correct permission', async () => {
      const permissions = await createTestPermissions(['shop.create']);
      const { user } = await createTestUser({
        role: {
          name: 'testRole',
          permissions: permissions.map(p => p._id),
          isActive: true
        }
      });
      
      // Populate role and permissions for user
      await user.populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });

      const req = {
        user: user
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('shop', 'create');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access without required permission', async () => {
      const permissions = await createTestPermissions(['shop.read']);
      const { user } = await createTestUser({
        role: {
          name: 'testRole',
          permissions: permissions.map(p => p._id),
          isActive: true
        }
      });

      await user.populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });

      const req = {
        user: user
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('shop', 'create');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access without user', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = checkPermission('shop', 'create');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

