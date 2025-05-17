// backend/src/controllers/commentController.js
const commentService = require('../services/commentService');

/**
 * Add a comment to a video
 */
const addComment = async (req, res, next) => {
  try {
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
      content
    );
    
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a video
 */
const getVideoComments = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const comments = await commentService.getVideoComments(
      parseInt(videoId),
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(comments);
  } catch (error) {
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
    next(error);
  }
};

module.exports = {
  addComment,
  getVideoComments,
  deleteComment,
  getCommentCount
};