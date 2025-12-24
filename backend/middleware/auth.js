const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key-for-jwt');
    // Populate role and its permissions
    const user = await User.findById(decoded.id)
      .populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional auth - doesn't fail if no token, but sets req.user if token is valid
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key-for-jwt');
      // Populate role and its permissions
      const user = await User.findById(decoded.id)
        .populate({
          path: 'role',
          populate: {
            path: 'permissions'
          }
        });
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without setting req.user
    next();
  }
};

const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRole = req.user.role?.name;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions' });
    }

    next();
  };
};

// Permission-based authorization - checks if user's role has the required permission
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Ensure role and permissions are populated
    if (!req.user.role) {
      return res.status(403).json({ message: 'User role not found' });
    }

    // If role permissions are not populated, populate them
    if (!req.user.role.permissions || req.user.role.permissions.length === 0 || typeof req.user.role.permissions[0] === 'string') {
      await req.user.populate({
        path: 'role',
        populate: {
          path: 'permissions'
        }
      });
    }

    const role = req.user.role;
    const permissions = role.permissions || [];

    // Check if role has the required permission
    const hasPermission = permissions.some(permission => {
      // Handle both populated and non-populated permissions
      if (typeof permission === 'string') {
        // If permission is just an ID string, we need to check differently
        // This shouldn't happen if permissions are properly populated, but handle it
        return false;
      }

      const permName = permission.name;
      const permResource = permission.resource;
      const permAction = permission.action;
      const permIsActive = permission.isActive !== false; // Default to true if not set

      // Skip inactive permissions
      if (!permIsActive) {
        return false;
      }

      // Check by permission name (e.g., 'shop.create') or by resource and action
      if (permName) {
        return permName === `${resource}.${action}`;
      } else if (permResource && permAction) {
        return permResource === resource && permAction === action;
      }
      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${resource}.${action}` 
      });
    }

    next();
  };
};

module.exports = { auth, optionalAuth, authorize, checkPermission };

