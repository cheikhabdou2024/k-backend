// backend/src/models/follow.js
module.exports = (sequelize, DataTypes) => {
    const Follow = sequelize.define('Follow', {
      followerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      followingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['followerId', 'followingId']
        }
      ]
    });
  
    Follow.associate = function(models) {
      Follow.belongsTo(models.User, {
        foreignKey: 'followerId',
        as: 'follower'
      });
      
      Follow.belongsTo(models.User, {
        foreignKey: 'followingId',
        as: 'following'
      });
    };
  
    return Follow;
  };