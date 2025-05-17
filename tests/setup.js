// backend/tests/setup.js
const { sequelize } = require('../src/models');

// Configure test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'video_app_test';

// Global setup - runs once before all tests
beforeAll(async () => {
  // Uncomment the following lines if you want to use a real test database
  // await sequelize.sync({ force: true }); // Reset database
  console.log('Test suite started');
});

// Global teardown - runs once after all tests
afterAll(async () => {
  // await sequelize.close(); // Close database connection
  console.log('Test suite completed');
});

// Mocks the console.error to keep test output clean
global.console.error = jest.fn();

// Suppress console.log in tests unless there's an error
global.console.log = jest.fn();