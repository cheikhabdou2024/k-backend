// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const followController = require('../controllers/followController');
const likeController = require('../controllers/likeController');
const authMiddleware = require('../middleware/auth');
const { standardLimiter, userLimiter } = require('../middleware/rateLimiter');
const { updateUserValidation, changePasswordValidation } = require('../validations/user');

// Apply standard rate limiter to all routes
router.use(standardLimiter);

// Public routes
/**
 * GET /api/users/:id - Get user profile
 */
router.get('/:id', userController.getUserProfile);

/**
 * GET /api/users/:id/videos - Get videos from a specific user
 */
router.get('/:id/videos', userController.getUserVideos);

/**
 * GET /api/users/search - Search for users
 */
router.get('/search', userController.searchUsers);

// Protected routes - require authentication
router.use(authMiddleware);

// Apply user-specific rate limiting to authenticated routes
router.use(userLimiter);

/**
 * GET /api/users/me - Get current authenticated user
 */
router.get('/me', userController.getCurrentUser);

/**
 * GET /api/users/suggested - Get suggested users
 */
router.get('/suggested', userController.getSuggestedUsers);

/**
 * PUT /api/users/:id - Update user profile
 */
router.put('/:id', updateUserValidation, userController.updateUserProfile);

/**
 * PUT /api/users/:id/password - Change user password
 */
router.put('/:id/password', changePasswordValidation, userController.changePassword);

// Follow-related routes
/**
 * POST /api/users/:userId/follow - Follow a user
 */
router.post('/:userId/follow', followController.followUser);

/**
 * DELETE /api/users/:userId/follow - Unfollow a user
 */
router.delete('/:userId/follow', followController.unfollowUser);

/**
 * GET /api/users/:userId/follow-status - Check if authenticated user is following this user
 */
router.get('/:userId/follow-status', followController.checkFollowStatus);

/**
 * GET /api/users/:userId/followers - Get users following this user
 */
router.get('/:userId/followers', followController.getFollowers);

/**
 * GET /api/users/:userId/following - Get users this user is following
 */
router.get('/:userId/following', followController.getFollowing);

/**
 * GET /api/users/:userId/follow-counts - Get follower and following counts
 */
router.get('/:userId/follow-counts', followController.getFollowCounts);

/**
 * GET /api/users/:userId/liked-videos - Get videos liked by this user
 */
router.get('/:userId/liked-videos', likeController.getUserLikedVideos);

module.exports = router;