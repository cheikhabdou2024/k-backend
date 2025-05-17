// backend/tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock the database operations
jest.mock('../../src/models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    avatar: 'default-avatar.png',
    bio: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return {
        id: this.id,
        username: this.username,
        email: this.email,
        avatar: this.avatar,
        bio: this.bio,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  };

  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn(() => Promise.resolve(mockUser)),
      scope: jest.fn(() => ({
        findByPk: jest.fn(() => Promise.resolve(mockUser))
      }))
    }
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedpassword')),
  compare: jest.fn(() => Promise.resolve(true))
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockedtoken')
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock findOne to return null (no existing user)
      User.findOne.mockImplementation(() => Promise.resolve(null));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should return 400 if username already exists', async () => {
      // Mock findOne to return an existing user with the same username
      User.findOne.mockImplementationOnce(() => Promise.resolve({
        id: 2,
        username: 'testuser',
        email: 'another@example.com'
      }));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already taken');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      // Mock findOne to return null for username check, but an existing user for email check
      User.findOne
        .mockImplementationOnce(() => Promise.resolve(null)) // Username check
        .mockImplementationOnce(() => Promise.resolve({ // Email check
          id: 3,
          username: 'another',
          email: 'test@example.com'
        }));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already in use');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'te', // Too short
          email: 'notanemail', // Invalid email
          password: 'pass' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login a user successfully', async () => {
      // Mock findOne to return a user
      User.findOne.mockImplementation(() => Promise.resolve({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        toJSON: function() {
          return {
            id: this.id,
            username: this.username,
            email: this.email
          };
        }
      }));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token', 'mockedtoken');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1 },
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should return 401 if user is not found', async () => {
      // Mock findOne to return null (user not found)
      User.findOne.mockImplementation(() => Promise.resolve(null));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return 401 if password is incorrect', async () => {
      // Mock findOne to return a user
      User.findOne.mockImplementation(() => Promise.resolve({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      }));

      // Mock bcrypt.compare to return false (password doesn't match)
      bcrypt.compare.mockImplementationOnce(() => Promise.resolve(false));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notanemail', // Invalid email
          password: '' // Empty password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });
});