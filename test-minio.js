// backend/test-minio.js
// Create this file to test MinIO connection

require('dotenv').config();
const { S3Client, ListBucketsCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');

console.log('🧪 Testing MinIO Connection...\n');

// Show configuration
console.log('📋 Configuration:');
console.log(`Endpoint: http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`);
console.log(`Access Key: ${process.env.MINIO_ACCESS_KEY || 'minio'}`);
console.log(`Secret Key: ${(process.env.MINIO_SECRET_KEY || 'minio123').replace(/./g, '*')}`);
console.log(`Bucket: ${process.env.MINIO_BUCKET || 'videos'}\n`);

// Create S3 client
const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio123'
  },
  forcePathStyle: true,
});

async function testConnection() {
  try {
    // Test 1: List buckets
    console.log('1️⃣ Listing buckets...');
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ Connected! Found buckets:', Buckets?.map(b => b.Name) || 'none');
    
    // Test 2: Check if videos bucket exists
    const videoBucketExists = Buckets?.some(b => b.Name === 'videos');
    
    if (!videoBucketExists) {
      console.log('\n2️⃣ Creating videos bucket...');
      await s3Client.send(new CreateBucketCommand({ Bucket: 'videos' }));
      console.log('✅ Videos bucket created!');
    } else {
      console.log('\n✅ Videos bucket already exists!');
    }
    
    console.log('\n🎉 MinIO is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Docker/MinIO not running');
    console.error('2. Wrong credentials');
    console.error('3. Port conflict');
    console.error('\nFull error:', error);
  }
}

testConnection();

// Run this with: node test-minio.js