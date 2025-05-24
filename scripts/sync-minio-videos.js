// backend/scripts/sync-minio-videos.js
// This script syncs videos from MinIO to your database

require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Video, User } = require('../src/models');

// MinIO client
const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio123'
  },
  forcePathStyle: true,
});

// Get or create a default user for videos
async function getDefaultUser() {
  try {
    // Try to find existing user
    let user = await User.findOne({ 
      where: { email: 'demo@tiktok.com' } 
    });
    
    if (!user) {
      // Create demo user
      const bcrypt = require('bcrypt');
      user = await User.create({
        username: 'demo_user',
        email: 'demo@tiktok.com',
        password: await bcrypt.hash('demo123', 10),
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        bio: 'Demo account for uploaded videos'
      });
      console.log('✅ Created demo user');
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error getting default user:', error);
    throw error;
  }
}

// List all videos in MinIO
async function listMinioVideos() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET || 'videos',
    });
    
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('❌ Error listing MinIO videos:', error);
    return [];
  }
}

// Check if video already exists in database
async function videoExistsInDb(storageKey) {
  const video = await Video.findOne({
    where: { storageKey }
  });
  return !!video;
}

// Create video URL from MinIO key
function createVideoUrl(key) {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || 9000;
  const bucket = process.env.MINIO_BUCKET || 'videos';
  return `http://${endpoint}:${port}/${bucket}/${key}`;
}

// Extract video info from filename
function extractVideoInfo(key) {
  const filename = key.split('/').pop();
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  return {
    title: nameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' '),
    description: `Video uploaded from MinIO: ${filename}`,
    filename: filename
  };
}

// Sync videos from MinIO to database
async function syncVideos() {
  console.log('🔄 Starting MinIO to Database sync...\n');
  
  try {
    // Get default user
    const defaultUser = await getDefaultUser();
    console.log(`👤 Using user: ${defaultUser.username} (ID: ${defaultUser.id})\n`);
    
    // List all videos in MinIO
    const minioVideos = await listMinioVideos();
    console.log(`📦 Found ${minioVideos.length} files in MinIO\n`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const object of minioVideos) {
      // Skip if not a video file
      if (!object.Key.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        console.log(`⏭️  Skipping non-video file: ${object.Key}`);
        skipped++;
        continue;
      }
      
      // Check if already in database
      if (await videoExistsInDb(object.Key)) {
        console.log(`✓ Already in database: ${object.Key}`);
        skipped++;
        continue;
      }
      
      // Extract video info
      const videoInfo = extractVideoInfo(object.Key);
      const videoUrl = createVideoUrl(object.Key);
      
      // Create database entry
      try {
        const video = await Video.create({
          title: videoInfo.title,
          description: videoInfo.description,
          url: videoUrl,
          thumbnail: videoUrl, // Use video as thumbnail for now
          userId: defaultUser.id,
          duration: 0, // Unknown duration
          fileSize: object.Size || 0,
          storageKey: object.Key,
          mimeType: 'video/mp4',
          originalFilename: videoInfo.filename,
          views: Math.floor(Math.random() * 1000), // Random views for demo
        });
        
        console.log(`✅ Imported: ${videoInfo.title} (ID: ${video.id})`);
        imported++;
      } catch (error) {
        console.error(`❌ Failed to import ${object.Key}:`, error.message);
      }
    }
    
    console.log(`\n📊 Sync Complete!`);
    console.log(`✅ Imported: ${imported} videos`);
    console.log(`⏭️  Skipped: ${skipped} files`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    process.exit();
  }
}

// Run sync
syncVideos();