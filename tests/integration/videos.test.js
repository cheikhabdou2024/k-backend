// backend/tests/integration/videos.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Video, User } = require('../../src/models');
const jwt = require('jsonwebtoken');

// Mock the database operations
jest.mock('../../src/models', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    avatar: 'default-avatar.png',
    bio: '',
    toJSON: function() {
      return {
        id: this.id,
        username: this.username,
        email: this.email,
        avatar: this.avatar,
        bio: this.bio
      };
    }
  };

  const mockVideo = {
    id: 1,
    title: 'Test Video',
    url: 'https://example.com/test.mp4',
    description: 'Test description',
    thumbnail: 'https://example.com/thumbnail.jpg',
    userId: 1,
    views: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: mockUser,
    toJSON: function() {
      return {
        id: this.id,
        title: this.title,
        url: this.url,
        description: this.description,
        thumbnail: this.thumbnail,
        userId: this.userId,
        views: this.views,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        author: this.author.toJSON()
      };
    }
  };

  return {
    Video: {
      findAll: jest.fn(() => Promise.resolve([mockVideo])),
      findByPk: jest.fn(() => Promise.resolve(mockVideo)),
      create: jest.fn(() => Promise.resolve(mockVideo)),
      findAndCountAll: jest.fn(() => Promise.resolve({
        count: 1,
        rows: [mockVideo]
      }))
    },
    User: {
      findByPk: jest.fn(() => Promise.resolve(mockUser))
    },
    sequelize: {
      transaction: jest.fn((callback) => callback({ commit: jest.fn(), rollback: jest.fn() }))
    }
  };
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockedtoken'),
  verify: jest.fn(() => ({ id: 1 }))
}));

describe('Videos API', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a valid auth token for testing protected routes
    authToken = 'Bearer mockedtoken';
  });

  describe('GET /api/videos', () => {
    it('should return a list of videos', async () => {
      const response = await request(app)
        .get('/api/videos');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.videos)).toBe(true);
      expect(response.body.videos.length).toBe(1);
      expect(response.body.videos[0]).toHaveProperty('title', 'Test Video');
      expect(Video.findAndCountAll).toHaveBeenCalled();
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/videos?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 2);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(Video.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5
        })
      );
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should return a single video by ID', async () => {
      const response = await request(app)
        .get('/api/videos/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('title', 'Test Video');
      expect(response.body).toHaveProperty('author');
      expect(response.body.author).toHaveProperty('username', 'testuser');
      expect(Video.findByPk).toHaveBeenCalledWith(
        '1',
        expect.any(Object)
      );
    });

    it('should return 404 if video not found', async () => {
      // Mock findByPk to return null
      Video.findByPk.mockImplementationOnce(() => Promise.resolve(null));

      const response = await request(app)
        .get('/api/videos/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/videos', () => {
    it('should create a new video when authenticated', async () => {
      const newVideo = {
        title: 'New Test Video',
        url: 'https://example.com/newtest.mp4',
        description: 'New test description'
      };

      const response = await request(app)
        .post('/api/videos')
        .set('Authorization', authToken)
        .send(newVideo);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('title', 'Test Video');
      expect(response.body).toHaveProperty('author');
      expect(Video.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          title: 'New Test Video',
          url: 'https://example.com/newtest.mp4',
          description: 'New test description'
        })
      );
    });

    it('should return 401 if not authenticated', async () => {
      const newVideo = {
        title: 'New Test Video',
        url: 'https://example.com/newtest.mp4',
        description: 'New test description'
      };

      const response = await request(app)
        .post('/api/videos')
        .send(newVideo);

      expect(response.status).toBe(401);
      expect(Video.create).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
      const invalidVideo = {
        title: '', // Empty title
        url: 'notavalidurl', // Invalid URL
        description: 'Description'
      };

      const response = await request(app)
        .post('/api/videos')
        .set('Authorization', authToken)
        .send(invalidVideo);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
      expect(Video.create).not.toHaveBeenCalled();
    });
  });

  // Additional tests for PUT, DELETE, etc. would follow a similar pattern
});