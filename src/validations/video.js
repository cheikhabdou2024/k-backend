// backend/src/validations/video.js
const { body } = require('express-validator');

/**
 * Validation rules for creating and updating videos
 */
const videoValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('url')
    .trim()
    .notEmpty().withMessage('Video URL is required')
    .isURL().withMessage('Must be a valid URL')
    .matches(/\.(mp4|mov|avi|wmv|flv|mkv|webm)($|\?)/i)
    .withMessage('URL must point to a video file (mp4, mov, avi, wmv, flv, mkv, webm)'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('thumbnail')
    .optional()
    .trim()
    .isURL().withMessage('Thumbnail must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)($|\?)/i)
    .withMessage('Thumbnail URL must point to an image file (jpg, jpeg, png, gif, webp)')
];

/**
 * Validation rules for creating videos only (stricter)
 */
const createVideoValidation = [
  ...videoValidation,
  
  // Make URL required only for creation
  body('url')
    .trim()
    .notEmpty().withMessage('Video URL is required')
    .isURL().withMessage('Must be a valid URL')
    .matches(/\.(mp4|mov|avi|wmv|flv|mkv|webm)($|\?)/i)
    .withMessage('URL must point to a video file (mp4, mov, avi, wmv, flv, mkv, webm)')
];

/**
 * Validation rules for updating videos (more lenient)
 */
const updateVideoValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('thumbnail')
    .optional()
    .trim()
    .isURL().withMessage('Thumbnail must be a valid URL')
    .matches(/\.(jpg|jpeg|png|gif|webp)($|\?)/i)
    .withMessage('Thumbnail URL must point to an image file (jpg, jpeg, png, gif, webp)')
];

module.exports = {
  videoValidation,
  createVideoValidation,
  updateVideoValidation
};