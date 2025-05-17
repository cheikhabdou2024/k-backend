// backend/src/controllers/likeController.js
const likeService = require('../services/likeService');

/**
 * Toggle like status for a video
 */
const toggleLike = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;
    
    const result = await likeService.toggleLike(userId, parseInt(videoId));
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a user has liked a video
 */
const checkLikeStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { videoId } = req.params;
    
    const liked = await likeService.hasLiked(userId, parseInt(videoId));
    
    res.json({ liked });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users who liked a video
 */
const getVideoLikers = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const users = await likeService.getVideoLikers(
      parseInt(videoId),
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Get videos liked by a user
 */
const getUserLikedVideos = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    const videos = await likeService.getUserLikedVideos(
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(videos);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleLike,
  checkLikeStatus,
  getVideoLikers,
  getUserLikedVideos
};