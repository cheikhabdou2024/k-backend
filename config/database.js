module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'votremotdepasse',
    database: process.env.DB_NAME || 'tiktok_clone',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    logging: false
  },
  test: {
    // Configuration de test
  },
  production: {
    // Configuration de production
  }
};