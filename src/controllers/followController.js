const followService = require('../services/followService');

/**
 * Follow a user
 */
const followUser = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;
    
    const result = await followService.followUser(
      followerId,
      parseInt(followingId)
    );
    
    res.status(201).json(result);
  } catch (error) {
    // Handle specific errors
    if (error.message === 'Users cannot follow themselves') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'User to follow not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Already following this user') {
      return res.status(400).json({ error: error.message });
    }
    
    next(error);
  }
};

/**
 * Unfollow a user
 */
const unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;
    
    const result = await followService.unfollowUser(
      followerId,
      parseInt(followingId)
    );
    
    res.json(result);
  } catch (error) {
    if (error.message === 'Not following this user') {
      return res.status(400).json({ error: error.message });
    }
    
    next(error);
  }
};

/**
 * Check if the authenticated user is following another user
 */
const checkFollowStatus = async (req, res, next) => {
  try {
    const followerId = req.user.id;
    const { userId: followingId } = req.params;
    
    const isFollowing = await followService.isFollowing(
      followerId,
      parseInt(followingId)
    );
    
    res.json({ isFollowing });
  } catch (error) {
    next(error);
  }
};

/**
 * Get users that a user is following
 */
const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const following = await followService.getFollowing(
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(following);
  } catch (error) {
    next(error);
  }
};

/**
 * Get users following a user
 */
const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const followers = await followService.getFollowers(
      parseInt(userId),
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json(followers);
  } catch (error) {
    next(error);
  }
};

/**
 * Get follower and following counts for a user
 */
const getFollowCounts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const followerCount = await followService.getFollowerCount(parseInt(userId));
    const followingCount = await followService.getFollowingCount(parseInt(userId));
    
    res.json({ followerCount, followingCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getFollowing,
  getFollowers,
  getFollowCounts
};