// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const { UploadService, upload } = require('../services/uploadService');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation rules for video upload
const uploadValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('duration')
    .optional()
    .isNumeric()
    .withMessage('Duration must be a number'),
  
  body('width')
    .optional()
    .isNumeric()
    .withMessage('Width must be a number'),
  
  body('height')
    .optional()
    .isNumeric()
    .withMessage('Height must be a number'),
];

/**
 * POST /api/upload/video
 * Upload a video file
 */
router.post(
  '/video',
  authMiddleware,
  upload.single('video'),
  uploadValidation,
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          await UploadService.cleanupTempFile(req.file.path);
        }
        return res.status(422).json({ 
          error: 'Validation failed',
          details: errors.array()
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'No video file provided'
        });
      }
      
      console.log('📤 Upload request received:', {
        user: req.user.id,
        file: req.file.originalname,
        size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
      });
      
      // Process the upload
      const result = await UploadService.processVideoUpload(
        req.file,
        req.body,
        req.user.id
      );
      
      // Return success response
      res.status(201).json({
        message: 'Video uploaded successfully',
        video: result.video,
        uploadInfo: {
          url: result.uploadInfo.url,
          size: result.uploadInfo.size
        }
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Clean up file on error
      if (req.file) {
        await UploadService.cleanupTempFile(req.file.path);
      }
      
      // Send appropriate error response
      if (error.message.includes('File too large')) {
        return res.status(413).json({
          error: 'File size exceeds limit (100MB)'
        });
      }
      
      if (error.message.includes('Invalid file type')) {
        return res.status(415).json({
          error: error.message
        });
      }
      
      next(error);
    }
  }
);

/**
 * GET /api/upload/status
 * Check upload service status
 */
router.get('/status', async (req, res) => {
  try {
    // Test MinIO connection
    const minioStatus = await testMinioConnection();
    
    res.json({
      status: 'healthy',
      storage: minioStatus ? 'connected' : 'disconnected',
      maxFileSize: '100MB',
      allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm']
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Helper function to test MinIO connection
async function testMinioConnection() {
  try {
    const { ListBucketsCommand } = require('@aws-sdk/client-s3');
    const { s3Client } = require('../../config/storage');
    
    await s3Client.send(new ListBucketsCommand({}));
    return true;
  } catch (error) {
    console.error('MinIO connection test failed:', error);
    return false;
  }
}

module.exports = router;