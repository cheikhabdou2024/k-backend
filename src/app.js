// backend/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { sequelize } = require('./models');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { standardLimiter, authLimiter } = require('./middleware/rateLimiter');
const uploadRoutes = require('./routes/upload');



// ======================
// 1. Middleware Setup
// ======================
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // Set specific origin in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Increased for video uploads
app.use(express.urlencoded({ extended: true }));

// Apply standard rate limiter globally
app.use(standardLimiter);

// ======================
// 2. Route Imports
// ======================
const videoRoutes = require('./routes/videos');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');

// ======================
// 3. Route Middleware
// ======================

// Auth routes - apply auth-specific rate limiter
app.use('/api/auth', authLimiter, authRoutes);

// Other routes
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

app.use('/api/upload', uploadRoutes);

// ======================
// 4. Health Check
// ======================
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';
  
  // Check database connection
  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (error) {
    console.error('Database connection error:', error);
  }
  
  // Check Redis connection (if used)
  try {
    const redis = require('redis').createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    
    if (redis.connected) {
      redisStatus = 'connected';
    }
  } catch (error) {
    console.error('Redis connection error:', error);
  }
  
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbStatus,
      redis: redisStatus
    }
  });
});

// ======================
// 5. Error Handling
// ======================
// 404 handler - must be placed after all routes
app.use(notFoundHandler);

// Global error handler - must be placed last
app.use(errorHandler);

// ======================
// 6. Server Startup
// ======================
const PORT = process.env.PORT || 3001;

// Allow controlled startup for testing
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      // Close database connection
      sequelize.close().then(() => {
        console.log('Database connection closed');
        process.exit(0);
      });
    });
  });
}

module.exports = app;