// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
    '!src/app.js',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  // Setup and teardown
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Mocks
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  // Test timeout
  testTimeout: 10000,
  // Verbose output
  verbose: true
};