// backend/src/controllers/videoController.js
const { Video, User, Like, Comment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Get all videos with pagination
 * GET /api/videos
 */
const getAllVideos = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      userId, 
      search 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Base query conditions
    const whereConditions = {};
    
    // Filter by user if provided
    if (userId) {
      whereConditions.userId = userId;
    }
    
    // Search in title or description if provided
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get videos with pagination
    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Like,
          as: 'likes',
          attributes: ['id'],
          // If user is authenticated, include a flag showing if they liked the video
          ...(req.user ? {
            include: [{
              model: User,
              as: 'user',
              attributes: [],
              where: { id: req.user.id },
              required: false
            }]
          } : {})
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true // Important for correct count with includes
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / parseInt(limit));
    
    // Add likedByMe property to each video if user is authenticated
    const videosWithLikeStatus = videos.map(video => {
      const videoJson = video.toJSON();
      
      // Calculate like count
      videoJson.likeCount = video.likes ? video.likes.length : 0;
      
      // Add liked status if user is authenticated
      if (req.user) {
        videoJson.likedByMe = video.likes.some(like => 
          like.user && like.user.id === req.user.id
        );
      }
      
      // Remove unnecessary likes array
      delete videoJson.likes;
      
      return videoJson;
    });
    
    res.json({
      videos: videosWithLikeStatus,
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
 * Get a single video by ID
 * GET /api/videos/:id
 */
const getVideoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'avatar', 'bio']
        },
        {
          model: Comment,
          as: 'comments',
          limit: 3,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar']
            }
          ]
        }
      ]
    });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Increment view count
    await video.increment('views');
    
    // Get like count
    const likeCount = await Like.count({ where: { videoId: id } });
    
    // Get comment count
    const commentCount = await Comment.count({ where: { videoId: id } });
    
    // Check if authenticated user liked the video
    let likedByMe = false;
    if (req.user) {
      const like = await Like.findOne({
        where: {
          videoId: id,
          userId: req.user.id
        }
      });
      likedByMe = !!like;
    }
    
    const videoData = video.toJSON();
    videoData.likeCount = likeCount;
    videoData.commentCount = commentCount;
    videoData.likedByMe = likedByMe;
    
    res.json(videoData);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new video
 * POST /api/videos
 */
const createVideo = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    
    const { title, url, description, thumbnail } = req.body;
    
    const video = await Video.create({
      title,
      url,
      description,
      thumbnail,
      userId: req.user.id
    });
    
    // Return the created video with author info
    const videoWithAuthor = await Video.findByPk(video.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });
    
    res.status(201).json(videoWithAuthor);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a video
 * PUT /api/videos/:id
 */
const updateVideo = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { title, description, thumbnail } = req.body;
    
    // Find the video
    const video = await Video.findByPk(id);
    
    // Check if video exists
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if user is the owner
    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update the video
    await video.update({
      title,
      description,
      thumbnail
    });
    
    // Return the updated video with author info
    const updatedVideo = await Video.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }]
    });
    
    res.json(updatedVideo);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a video
 * DELETE /api/videos/:id
 */
const deleteVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the video
    const video = await Video.findByPk(id);
    
    // Check if video exists
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Check if user is the owner
    if (video.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete the video (this will cascade delete likes and comments due to foreign key constraints)
    await video.destroy();
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending videos (most viewed in the last week)
 * GET /api/videos/trending
 */
const getTrendingVideos = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get videos created within the last 7 days, sorted by view count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const videos = await Video.findAll({
      where: {
        createdAt: {
          [Op.gte]: oneWeekAgo
        }
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }],
      limit: parseInt(limit),
      order: [['views', 'DESC']]
    });
    
    res.json(videos);
  } catch (error) {
    next(error);
  }
};

/**
 * Get videos from users that the authenticated user follows
 * GET /api/videos/following
 */
const getFollowingVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get IDs of users that the authenticated user follows
    const followedUsers = await req.user.getFollowing();
    const followedUserIds = followedUsers.map(user => user.id);
    
    // If not following anyone, return empty array
    if (followedUserIds.length === 0) {
      return res.json({
        videos: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }
    
    // Get videos from followed users
    const { count, rows: videos } = await Video.findAndCountAll({
      where: {
        userId: {
          [Op.in]: followedUserIds
        }
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'avatar']
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
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

module.exports = {
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getTrendingVideos,
  getFollowingVideos
};