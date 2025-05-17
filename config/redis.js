// Fichier: config/redis.js
const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Gestion des erreurs
redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Connexion réussie
redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

module.exports = redisClient;