const mongoose = require('mongoose');
const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  let testRole;

  beforeAll(async () => {
    testRole = await Role.create({
      name: 'testRole',
      description: 'Test Role',
      isActive: true,
      permissions: []
    });
  });

  it('should create a user with all required fields', async () => {
    const userData = {
      email: 'model@test.com',
      password: 'password123',
      phone: '1234567890',
      role: testRole._id,
      isActive: true
    };

    const user = await User.create(userData);
    expect(user).toBeDefined();
    expect(user.email).toBe('model@test.com');
    expect(user.phone).toBe('1234567890');
    expect(user.role.toString()).toBe(testRole._id.toString());
  });

  it('should hash password before saving', async () => {
    const userData = {
      email: 'hash@test.com',
      password: 'plainpassword',
      phone: '1111111111',
      role: testRole._id
    };

    const user = await User.create(userData);
    expect(user.password).not.toBe('plainpassword');
    expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
  });

  it('should require email field', async () => {
    const userData = {
      password: 'password123',
      phone: '1234567890',
      role: testRole._id
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should require unique email', async () => {
    const userData = {
      email: 'unique@test.com',
      password: 'password123',
      phone: '1234567890',
      role: testRole._id
    };

    await User.create(userData);
    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should validate password minimum length', async () => {
    const userData = {
      email: 'short@test.com',
      password: '12345', // Less than 6 characters
      phone: '1234567890',
      role: testRole._id
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  it('should compare password correctly', async () => {
    const userData = {
      email: 'compare@test.com',
      password: 'correctpassword',
      phone: '1234567890',
      role: testRole._id
    };

    const user = await User.create(userData);
    const isMatch = await user.comparePassword('correctpassword');
    expect(isMatch).toBe(true);

    const isWrong = await user.comparePassword('wrongpassword');
    expect(isWrong).toBe(false);
  });

  it('should lowercase email before saving', async () => {
    const userData = {
      email: 'UPPERCASE@TEST.COM',
      password: 'password123',
      phone: '1234567890',
      role: testRole._id
    };

    const user = await User.create(userData);
    expect(user.email).toBe('uppercase@test.com');
  });
});

