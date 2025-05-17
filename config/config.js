require('dotenv').config();

module.exports = {
    development: {
      username: process.env.DB_USER || 'postgres', // Default Docker Postgres user
      password: process.env.DB_PASSWORD || 'postgres', // Default Docker Postgres password
      database: process.env.DB_NAME || 'video_app',
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: console.log // Add this to see connection logs
    }
  }