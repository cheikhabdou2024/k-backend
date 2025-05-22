// backend/src/controllers/commentController.js
const commentService = require('../services/commentService');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Add a comment to a video
 */
const addComment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const { videoId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        error: 'Comment content cannot be empty'
      });
    }
    
    const comment = await commentService.addComment(
      userId,
      parseInt(videoId),
      content.trim()
    );
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    next(error);
  }
};

/**
 * Get comments for a video
 */
const getVideoComments = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { limit = 20, offset = 0, page = 1 } = req.query;
    
    // Convert page to offset if page is provided
    const actualOffset = page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(offset);
    
    const result = await commentService.getVideoComments(
      parseInt(videoId),
      parseInt(limit),
      actualOffset
    );
    
    // Format response for frontend compatibility
    const response = {
      comments: result.comments || result,
      pagination: result.pagination || {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.comments ? result.comments.length : result.length,
        hasMore: result.comments ? result.comments.length === parseInt(limit) : result.length === parseInt(limit)
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching comments:', error);
    next(error);
  }
};

/**
 * Delete a comment
 */
const deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    
    const result = await commentService.deleteComment(
      parseInt(commentId),
      userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error.message === 'Comment not found') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (error.message === 'Unauthorized to delete this comment') {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }
    next(error);
  }
};

/**
 * Get comment count for a video
 */
const getCommentCount = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    
    const count = await commentService.getCommentCount(parseInt(videoId));
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    next(error);
  }
};

/**
 * Like/unlike a comment
 */
const toggleCommentLike = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    
    const result = await commentService.toggleCommentLike(
      parseInt(commentId),
      userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error toggling comment like:', error);
    if (error.message === 'Comment not found') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    next(error);
  }
};

module.exports = {
  addComment,
  getVideoComments,
  deleteComment,
  getCommentCount,
  toggleCommentLike
};