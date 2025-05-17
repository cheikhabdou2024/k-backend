require('dotenv').config();

module.exports = {
    development: {
      username: process.env.DB_USER || 'postgres', // Default Docker Postgres user
      password: process.env.DB_PASSWORD || 'votremotdepasse', // Default Docker Postgres password
      database: process.env.DB_NAME || 'tiktok_clone',
      host: process.env.DB_HOST || '127.0.0.1',
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: console.log // Add this to see connection logs
    }
  }