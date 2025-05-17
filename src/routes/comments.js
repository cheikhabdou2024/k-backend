// backend/src/routes/comments.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const { standardLimiter } = require('../middleware/rateLimiter');
const { body } = require('express-validator');

// Apply rate limiter to all comment routes
router.use(standardLimiter);

// All comment routes require authentication
router.use(authMiddleware);

const commentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

/**
 * DELETE /api/comments/:id - Delete a comment
 */
router.delete('/:commentId', commentController.deleteComment);

/**
 * Note: Other comment routes are in the videos router:
 * - POST /api/videos/:videoId/comments - Add a comment
 * - GET /api/videos/:videoId/comments - Get comments for a video
 * - GET /api/videos/:videoId/comments/count - Get comment count
 */

module.exports = router;