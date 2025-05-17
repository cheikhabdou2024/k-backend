// backend/src/middleware/rateLimiter.js
const redis = require('redis');
const { AppError } = require('./errorHandler');

// Create Redis client
let redisClient;

try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });
} catch (error) {
  console.error('Redis connection failed:', error);
  // Fall back to in-memory storage if Redis is not available
}

// In-memory fallback for rate limiting when Redis is not available
const inMemoryCache = new Map();

/**
 * Rate limiter middleware factory
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests in the time window
 * @param {string} options.keyGenerator - Function to generate a unique key for the request (default: IP address)
 * @param {string} options.handler - Function to handle rate limit exceeded
 * @returns {Function} Express middleware
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute window by default
    max = 60, // 60 requests per window by default
    keyGenerator = (req) => req.ip, // IP-based rate limiting by default
    handler = (req, res, next) => {
      next(new AppError('Too many requests, please try again later', 429, 'rate_limit_error'));
    }
  } = options;
  
  return async (req, res, next) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      
      if (redisClient && redisClient.connected) {
        // Use Redis for rate limiting
        const currentCount = await redisClient.get(key);
        
        if (currentCount && parseInt(currentCount) >= max) {
          return handler(req, res, next);
        }
        
        await redisClient.multi()
          .incr(key)
          .expire(key, windowMs / 1000)
          .exec();
      } else {
        // Use in-memory cache for rate limiting
        const now = Date.now();
        const cacheItem = inMemoryCache.get(key) || { count: 0, startTime: now };
        
        // Reset counter if window has elapsed
        if (now - cacheItem.startTime > windowMs) {
          cacheItem.count = 0;
          cacheItem.startTime = now;
        }
        
        // Check if rate limit is exceeded
        if (cacheItem.count >= max) {
          return handler(req, res, next);
        }
        
        // Increment counter
        cacheItem.count += 1;
        inMemoryCache.set(key, cacheItem);
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block the request if rate limiter fails
      next();
    }
  };
};

/**
 * Different rate limiter configurations for different routes
 */

// Standard API rate limiter (60 requests per minute)
const standardLimiter = rateLimiter();

// Authentication rate limiter (10 requests per minute)
const authLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `auth:${req.ip}`
});

// User-specific rate limiter (100 requests per minute)
const userLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => `user:${req.user ? req.user.id : req.ip}`
});

module.exports = {
  standardLimiter,
  authLimiter,
  userLimiter
};