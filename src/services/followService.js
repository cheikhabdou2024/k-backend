// backend/src/services/followService.js
const { Follow, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Follow a user
 */
const followUser = async (followerId, followingId) => {
  // Prevent following oneself
  if (followerId === followingId) {
    throw new Error('Users cannot follow themselves');
  }
  
  // Check if the target user exists
  const targetUser = await User.findByPk(followingId);
  if (!targetUser) {
    throw new Error('User to follow not found');
  }
  
  // Check if already following
  const existingFollow = await Follow.findOne({
    where: {
      followerId,
      followingId
    }
  });
  
  if (existingFollow) {
    throw new Error('Already following this user');
  }
  
  // Create the follow relationship
  await Follow.create({
    followerId,
    followingId
  });
  
  return { success: true };
};

/**
 * Unfollow a user
 */
const unfollowUser = async (followerId, followingId) => {
  const follow = await Follow.findOne({
    where: {
      followerId,
      followingId
    }
  });
  
  if (!follow) {
    throw new Error('Not following this user');
  }
  
  await follow.destroy();
  return { success: true };
};

/**
 * Check if a user is following another
 */
const isFollowing = async (followerId, followingId) => {
  const follow = await Follow.findOne({
    where: {
      followerId,
      followingId
    }
  });
  
  return !!follow;
};

/**
 * Get users that a user is following
 */
const getFollowing = async (userId, limit = 20, offset = 0) => {
  const follows = await Follow.findAll({
    where: {
      followerId: userId
    },
    include: [{
      model: User,
      as: 'following',
      attributes: ['id', 'username', 'avatar', 'bio']
    }],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
  
  return follows.map(follow => follow.following);
};

/**
 * Get users following a user
 */
const getFollowers = async (userId, limit = 20, offset = 0) => {
  const follows = await Follow.findAll({
    where: {
      followingId: userId
    },
    include: [{
      model: User,
      as: 'follower',
      attributes: ['id', 'username', 'avatar', 'bio']
    }],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });
  
  return follows.map(follow => follow.follower);
};

/**
 * Get follower count for a user
 */
const getFollowerCount = async (userId) => {
  return await Follow.count({
    where: {
      followingId: userId
    }
  });
};

/**
 * Get following count for a user
 */
const getFollowingCount = async (userId) => {
  return await Follow.count({
    where: {
      followerId: userId
    }
  });
};

module.exports = {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowing,
  getFollowers,
  getFollowerCount,
  getFollowingCount
};