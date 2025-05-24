// backend/src/services/uploadService.js
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../../config/storage');
const { Video } = require('../models');

class UploadService {
  /**
   * Configure multer for temporary file storage
   */
  static getMulterConfig() {
    // Store files temporarily on disk
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/temp');
        
        // Create directory if it doesn't exist
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `video_${uniqueId}${ext}`);
      }
    });

    // File filter for videos only
    const fileFilter = (req, file, cb) => {
      const allowedMimes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/webm'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      }
    });
  }

  /**
   * Upload video to MinIO/S3
   */
  static async uploadToStorage(filePath, filename, mimetype) {
    try {
      console.log('📤 Uploading to MinIO:', filename);
      
      // Read file
      const fileContent = await fs.readFile(filePath);
      
      // Generate storage path
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const storageKey = `videos/${year}/${month}/${day}/${filename}`;
      
      // Upload to MinIO
      const uploadParams = {
        Bucket: process.env.MINIO_BUCKET || 'videos',
        Key: storageKey,
        Body: fileContent,
        ContentType: mimetype,
      };
      
      await s3Client.send(new PutObjectCommand(uploadParams));
      
      // Generate public URL
      const publicUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${uploadParams.Bucket}/${storageKey}`;
      
      console.log('✅ Upload successful:', publicUrl);
      
      return {
        key: storageKey,
        url: publicUrl,
        size: fileContent.length
      };
    } catch (error) {
      console.error('❌ MinIO upload error:', error);
      throw new Error(`Failed to upload to storage: ${error.message}`);
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFromStorage(key) {
    try {
      const deleteParams = {
        Bucket: process.env.MINIO_BUCKET || 'videos',
        Key: key,
      };
      
      await s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log('✅ Deleted from storage:', key);
    } catch (error) {
      console.error('❌ Failed to delete from storage:', error);
    }
  }

  /**
   * Clean up temporary file
   */
  static async cleanupTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log('🧹 Cleaned up temp file:', filePath);
    } catch (error) {
      console.error('❌ Failed to cleanup temp file:', error);
    }
  }

  /**
   * Process uploaded video
   */
  static async processVideoUpload(file, videoData, userId) {
    let uploadedFile = null;
    
    try {
      console.log('🎬 Processing video upload:', {
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      });
      
      // Upload to MinIO
      uploadedFile = await this.uploadToStorage(
        file.path,
        file.filename,
        file.mimetype
      );
      
      // Create database record
      const video = await Video.create({
        title: videoData.title || 'Untitled Video',
        description: videoData.description || '',
        url: uploadedFile.url,
        thumbnail: videoData.thumbnail || uploadedFile.url, // Use video URL as thumbnail for now
        userId: userId,
        duration: videoData.duration || 0,
        fileSize: uploadedFile.size,
        storageKey: uploadedFile.key,
        mimeType: file.mimetype,
        originalFilename: file.originalname,
        width: videoData.width || null,
        height: videoData.height || null,
        aspectRatio: videoData.aspectRatio || null,
      });
      
      // Clean up temp file
      await this.cleanupTempFile(file.path);
      
      console.log('✅ Video processing complete:', video.id);
      
      return {
        success: true,
        video: video,
        uploadInfo: uploadedFile
      };
      
    } catch (error) {
      console.error('❌ Video processing error:', error);
      
      // Cleanup on error
      if (file.path) {
        await this.cleanupTempFile(file.path);
      }
      
      if (uploadedFile && uploadedFile.key) {
        await this.deleteFromStorage(uploadedFile.key);
      }
      
      throw error;
    }
  }

  /**
   * Generate video thumbnail (placeholder for now)
   */
  static async generateThumbnail(videoPath) {
    // In a real implementation, you would use ffmpeg or similar
    // For now, return null and use video URL as thumbnail
    return null;
  }

  /**
   * Get video metadata (placeholder for now)
   */
  static async getVideoMetadata(videoPath) {
    // In a real implementation, you would use ffprobe or similar
    // For now, return basic info
    return {
      duration: 0,
      width: null,
      height: null,
      aspectRatio: null
    };
  }
}

// Export configured multer instance
const upload = UploadService.getMulterConfig();

module.exports = {
  UploadService,
  upload
};