const environments = {
    development: {
      name: 'development',
      port: 3000,
      db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    },
    test: {
      name: 'test',
      port: 3001,
      db: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password'
      },
      redis: {
        host: 'localhost',
        port: 6379
      }
    },
    production: {
      name: 'production',
      port: process.env.PORT || 3000,
      db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    }
  };
  
  module.exports = environments[process.env.NODE_ENV || 'development'];
  
  
  
  
  