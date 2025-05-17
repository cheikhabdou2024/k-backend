// backend/src/services/likeService.js
const { Like, Video, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Toggle like status for a video
 * If the user has already liked the video, unlike it
 * If the user hasn't liked the video, like it
 */
const toggleLike = async (userId, videoId) => {
  const existingLike = await Like.findOne({
    where: {
      userId,
      videoId
    }
  });
  
  if (existingLike) {
    // User already liked this video - unlike it
    await existingLike.destroy();
    return { liked: false };
  } else {
    // User hasn't liked this video - like it
    await Like.create({
      userId,
      videoId
    });
    return { liked: true };
  }
};

/**
 * Check if a user has liked a video
 */
const hasLiked = async (userId, videoId) => {
  const like = await Like.findOne({
    where: {
      userId,
      videoId
    }
  });
  
  return !!like;
};

/**
 * Get total likes for a video
 */
const getVideoLikesCount = async (videoId) => {
  return await Like.count({
    where: {
      videoId
    }
  });
};

/**
 * Get users who liked a specific video
 */
const getVideoLikers = async (videoId, limit = 10, offset = 0) => {
  const likes = await Like.findAll({
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
  
  return likes.map(like => like.user);
};

/**
 * Get videos liked by a user
 */
const getUserLikedVideos = async (userId, limit = 10, offset = 0) => {
  const likes = await Like.findAll({
    where: {
      userId
    },
    include: [{
      model: Video,
      as: 'video',
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    }],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
  
  return likes.map(like => like.video);
};

module.exports = {
  toggleLike,
  hasLiked,
  getVideoLikesCount,
  getVideoLikers,
  getUserLikedVideos
};