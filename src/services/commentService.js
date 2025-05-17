// backend/src/services/commentService.js
const { Comment, User, Video } = require('../models');

/**
 * Add a comment to a video
 */
const addComment = async (userId, videoId, content) => {
  const comment = await Comment.create({
    userId,
    videoId,
    content
  });
  
  // Return comment with user data
  return await Comment.findByPk(comment.id, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'avatar']
    }]
  });
};

/**
 * Get comments for a video
 */
const getVideoComments = async (videoId, limit = 20, offset = 0) => {
  return await Comment.findAll({
    where: {
      videoId
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'avatar']
    }],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Delete a comment
 * Only the comment creator or video owner can delete a comment
 */
const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findByPk(commentId, {
    include: [{
      model: Video,
      as: 'video'
    }]
  });
  
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  // Check if user is either comment creator or video owner
  if (comment.userId !== userId && comment.video.userId !== userId) {
    throw new Error('Unauthorized to delete this comment');
  }
  
  await comment.destroy();
  return { deleted: true };
};

/**
 * Get total comments for a video
 */
const getCommentCount = async (videoId) => {
  return await Comment.count({
    where: {
      videoId
    }
  });
};

module.exports = {
  addComment,
  getVideoComments,
  deleteComment,
  getCommentCount
};