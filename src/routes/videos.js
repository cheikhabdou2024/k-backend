// backend/src/routes/videos.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const likeController = require('../controllers/likeController');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const { standardLimiter, userLimiter } = require('../middleware/rateLimiter');
const { createVideoValidation, updateVideoValidation } = require('../validations/video');
const { body } = require('express-validator');


// Apply rate limiter to all video routes
router.use(standardLimiter);

// Public routes
/**
 * GET /api/videos - Get all videos with pagination
 */
router.get('/', videoController.getAllVideos);

/**
 * GET /api/videos/trending - Get trending videos
 */
router.get('/trending', videoController.getTrendingVideos);

/**
 * GET /api/videos/:id - Get a single video by ID
 */
router.get('/:id', videoController.getVideoById);

// Comment validation middleware
const commentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

// PUBLIC COMMENT ROUTES (no auth required for viewing)
/**
 * GET /api/videos/:videoId/comments - Get comments for a video
 */
router.get('/:videoId/comments', commentController.getVideoComments);

/**
 * GET /api/videos/:videoId/comments/count - Get comment count for a video
 */
router.get('/:videoId/comments/count', commentController.getCommentCount);

// Protected routes - require authentication
router.use(authMiddleware);

/**
 * GET /api/videos/following - Get videos from users that the authenticated user follows
 */
router.get('/following', userLimiter, videoController.getFollowingVideos);

/**
 * POST /api/videos - Create a new video
 */
router.post('/', createVideoValidation, videoController.createVideo);

/**
 * PUT /api/videos/:id - Update a video
 */
router.put('/:id', updateVideoValidation, videoController.updateVideo);

/**
 * DELETE /api/videos/:id - Delete a video
 */
router.delete('/:id', videoController.deleteVideo);

// Like-related routes
/**
 * POST /api/videos/:videoId/like - Toggle like status
 */
router.post('/:videoId/like', likeController.toggleLike);

/**
 * GET /api/videos/:videoId/like - Check if user has liked a video
 */
router.get('/:videoId/like', likeController.checkLikeStatus);

/**
 * GET /api/videos/:videoId/likes - Get users who liked a video
 */
router.get('/:videoId/likes', likeController.getVideoLikers);

// Comment-related routes
/**
 * POST /api/videos/:videoId/comments - Add a comment to a video
 */
router.post('/:videoId/comments', commentController.addComment);

/**
 * GET /api/videos/:videoId/comments - Get comments for a video
 */
router.get('/:videoId/comments', commentController.getVideoComments);

/**
 * GET /api/videos/:videoId/comments/count - Get comment count for a video
 */
router.get('/:videoId/comments/count', commentController.getCommentCount);

module.exports = router;