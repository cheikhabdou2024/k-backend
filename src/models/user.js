// backend/src/models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'default-avatar.png'
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: {
        attributes: {}
      }
    }
  });

  User.associate = function(models) {
    // A user has many videos
    User.hasMany(models.Video, {
      foreignKey: 'userId',
      as: 'videos'
    });
    
    // A user has many comments
    User.hasMany(models.Comment, {
      foreignKey: 'userId',
      as: 'comments'
    });
    
    // A user has many likes
    User.hasMany(models.Like, {
      foreignKey: 'userId',
      as: 'likes'
    });
    
    // A user follows many users
    User.belongsToMany(models.User, {
      through: models.Follow,
      as: 'following',
      foreignKey: 'followerId'
    });
    
    // A user has many followers
    User.belongsToMany(models.User, {
      through: models.Follow,
      as: 'followers',
      foreignKey: 'followingId'
    });
  };

  return User;
};