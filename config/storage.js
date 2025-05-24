// Fichier: config/storage.js
const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9001}`,
  region: 'us-east-1', // Peu importe avec MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio123'
  },
  forcePathStyle: true, // Nécessaire pour MinIO
  signatureVersion: 'v4', // Utilisé par MinIO

});

const testMinioConnection = async () => {
  try {
    const { ListBucketsCommand } = require('@aws-sdk/client-s3');
    const response = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ MinIO connected! Buckets:', response.Buckets?.map(b => b.Name));
    return true;
  } catch (error) {
    console.error('❌ MinIO connection failed:', error.message);
    return false;
  }
};

// Run test on startup
testMinioConnection();

module.exports = {
  s3Client,
  testMinioConnection,

  // Fonctions utilitaires pour le stockage de vidéos
  uploadVideo: async (fileBuffer, fileName, contentType = 'video/mp4') => {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    
    const params = {
      Bucket: process.env.MINIO_BUCKET || 'videos',
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType
    };
    
    try {
      await s3Client.send(new PutObjectCommand(params));
      return `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9001}/${params.Bucket}/${fileName}`;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },
  
  getVideoUrl: (fileName) => {
    const bucket = process.env.MINIO_BUCKET || 'videos';
    return `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9001}/${bucket}/${fileName}`;
  }
};