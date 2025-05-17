// backend/src/models/video.js
module.exports = (sequelize, DataTypes) => {
  const Video = sequelize.define('Video', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 1000]
      }
    },
    thumbnail: {
      type: DataTypes.STRING
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      }
    ]
  });

  Video.associate = function(models) {
    // A video belongs to a user
    Video.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author'
    });
    
    // A video has many comments
    Video.hasMany(models.Comment, {
      foreignKey: 'videoId',
      as: 'comments'
    });
    
    // A video has many likes
    Video.hasMany(models.Like, {
      foreignKey: 'videoId',
      as: 'likes'
    });
  };

  return Video;
};