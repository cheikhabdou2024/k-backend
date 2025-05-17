module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'votremotdepasse',
    database: process.env.DB_NAME || 'tiktok_clone',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  },
  test: {
    // Configuration de test
  },
  production: {
    // Configuration de production
  }
};