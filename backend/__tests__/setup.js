const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup: Run before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
});

// Cleanup: Run after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Teardown: Run after all tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.JWT_EXPIRE = '1d';
process.env.NODE_ENV = 'test';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'test-password';

// Mock email utility for tests
jest.mock('../utils/email', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true)
}));

