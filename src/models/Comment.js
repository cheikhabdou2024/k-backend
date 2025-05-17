// backend/src/models/comment.js
module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('Comment', {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 500]  // Restrict comment length
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      videoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Videos',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    Comment.associate = function(models) {
      Comment.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      Comment.belongsTo(models.Video, {
        foreignKey: 'videoId',
        as: 'video'
      });
    };
  
    return Comment;
  };