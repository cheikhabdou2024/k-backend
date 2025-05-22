// backend/src/services/commentService.js
const { Comment, User, Video, Like } = require('../models');
const { Op } = require('sequelize');

/**
 * Add a comment to a video
 */
const addComment = async (userId, videoId, content) => {
  try {
    // Check if video exists
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Create the comment
    const comment = await Comment.create({
      userId,
      videoId,
      content: content.trim()
    });
    
    // Return comment with user data
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatar']
      }]
    });

    return commentWithUser;
  } catch (error) {
    console.error('Error in addComment service:', error);
    throw error;
  }
};

/**
 * Get comments for a video with pagination
 */
const getVideoComments = async (videoId, limit = 20, offset = 0) => {
  try {
    const comments = await Comment.findAll({
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

    // Add like counts and liked status (if needed)
    const commentsWithLikes = await Promise.all(
      comments.map(async (comment) => {
        const likeCount = await Like.count({
          where: { 
            commentId: comment.id 
          }
        });

        return {
          ...comment.toJSON(),
          likes: likeCount,
          isLiked: false, // TODO: Check if current user liked this comment
          replies: [] // TODO: Implement replies if needed
        };
      })
    );

    return commentsWithLikes;
  } catch (error) {
    console.error('Error in getVideoComments service:', error);
    throw error;
  }
};

/**
 * Delete a comment
 */
const deleteComment = async (commentId, userId) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteComment service:', error);
    throw error;
  }
};

/**
 * Get total comments for a video
 */
const getCommentCount = async (videoId) => {
  try {
    const count = await Comment.count({
      where: {
        videoId
      }
    });

    return count;
  } catch (error) {
    console.error('Error in getCommentCount service:', error);
    throw error;
  }
};

/**
 * Toggle like on a comment
 */
const toggleCommentLike = async (commentId, userId) => {
  try {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if user already liked this comment
    const existingLike = await Like.findOne({
      where: {
        userId,
        commentId
      }
    });

    let liked = false;
    if (existingLike) {
      // Unlike the comment
      await existingLike.destroy();
      liked = false;
    } else {
      // Like the comment
      await Like.create({
        userId,
        commentId
      });
      liked = true;
    }

    // Get updated like count
    const likeCount = await Like.count({
      where: { commentId }
    });

    return {
      liked,
      totalLikes: likeCount
    };
  } catch (error) {
    console.error('Error in toggleCommentLike service:', error);
    throw error;
  }
};

module.exports = {
  addComment,
  getVideoComments,
  deleteComment,
  getCommentCount,
  toggleCommentLike
};