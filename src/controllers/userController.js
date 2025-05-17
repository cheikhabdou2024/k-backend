// backend/src/controllers/userController.js
const { User, Video, Follow } = require('../models');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * Get user profile
 * GET /api/users/:id
 */
const getUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      throw new AppError('User not found', 404, 'not_found');
    }
    
    // Get follower and following counts
    const followerCount = await Follow.count({
      where: { followingId: id }
    });
    
    const followingCount = await Follow.count({
      where: { followerId: id }
    });
    
    // Get video count
    const videoCount = await Video.count({
      where: { userId: id }
    });
    
    // Check if authenticated user is following this user
    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        where: {
          followerId: req.user.id,
          followingId: id
        }
      });
      isFollowing = !!follow;
    }
    
    // Prepare response
    const userProfile = {
      ...user.toJSON(),
      followerCount,
      followingCount,
      videoCount,
      isFollowing
    };
    
    res.json(userProfile);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 422, 'validation_error', 
        errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      );
    }
    
    // Only allow users to update their own profile
    if (req.user.id !== parseInt(id)) {
      throw new AppError('Unauthorized', 403, 'authorization_error');
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404, 'not_found');
    }
    
    // Fields that can be updated
    const { username, bio, avatar } = req.body;
    
    // Update only provided fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    // Update user
    await user.update(updateData);
    
    // Return updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    res.json(updatedUser);
  } catch (error) {
    // Handle unique constraint error for username
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.errors[0].path === 'username') {
        return next(new AppError('Username already taken', 409, 'conflict_error'));
      }
    }
    next(error);
  }
};

/**
 * Change user password
 * PUT /api/users/:id/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only allow users to change their own password
    if (req.user.id !== parseInt(id)) {
      throw new AppError('Unauthorized', 403, 'authorization_error');
    }
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 422, 'validation_error', 
        errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      );
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Find user with password
    const user = await User.scope('withPassword').findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404, 'not_found');
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401, 'authentication_error');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await user.update({ password: hashedPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user videos
 * GET /api/users/:id/videos
 */
const getUserVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('User not found', 404, 'not_found');
    }
    
    // Get user videos with pagination
    const { count, rows: videos } = await Video.findAndCountAll({
      where: { userId: id },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }],
      distinct: true
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.json({
      videos,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users
 * GET /api/users/search
 */
const searchUsers = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (!query) {
      throw new AppError('Search query is required', 400, 'validation_error');
    }
    
    // Search for users with username or bio matching the query
    const { count, rows: users } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${query}%` } },
          { bio: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset,
      order: [['username', 'ASC']]
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / parseInt(limit));
    
    res.json({
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get suggested users (users with most followers, excluding those already followed)
 * GET /api/users/suggested
 */
const getSuggestedUsers = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user ? req.user.id : null;
    
    // Find users with most followers
    // If user is authenticated, exclude users they already follow
    const users = await User.findAll({
      attributes: {
        exclude: ['password'],
        include: [
          [
            // Count followers for each user
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Follows"
              WHERE "Follows"."followingId" = "User"."id"
            )`),
            'followerCount'
          ]
        ]
      },
      // Exclude current user
      where: userId ? { id: { [Op.ne]: userId } } : {},
      order: [[sequelize.literal('followerCount'), 'DESC']],
      limit: parseInt(limit)
    });
    
    // If user is authenticated, check which suggested users they already follow
    if (userId) {
      const followedUsers = await Follow.findAll({
        where: {
          followerId: userId,
          followingId: {
            [Op.in]: users.map(user => user.id)
          }
        }
      });
      
      const followedUserIds = followedUsers.map(follow => follow.followingId);
      
      // Add isFollowing property to each user
      users.forEach(user => {
        user.dataValues.isFollowing = followedUserIds.includes(user.id);
      });
    }
    
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 * GET /api/users/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      throw new AppError('User not found', 404, 'not_found');
    }
    
    // Get counts
    const followerCount = await Follow.count({
      where: { followingId: userId }
    });
    
    const followingCount = await Follow.count({
      where: { followerId: userId }
    });
    
    const videoCount = await Video.count({
      where: { userId }
    });
    
    res.json({
      ...user.toJSON(),
      followerCount,
      followingCount,
      videoCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserVideos,
  searchUsers,
  getSuggestedUsers,
  getCurrentUser
};