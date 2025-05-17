// backend/src/validations/user.js
const { body } = require('express-validator');

/**
 * Validation rules for updating user profile
 */
const updateUserValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 160 }).withMessage('Bio cannot exceed 160 characters'),
  
  body('avatar')
    .optional()
    .trim()
    .isURL().withMessage('Avatar must be a valid URL')
];

/**
 * Validation rules for changing password
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .not().equals(body('currentPassword')).withMessage('New password must be different from current password'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation for search query
 */
const searchValidation = [
  body('query')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Search query must be between 1 and 50 characters')
];

module.exports = {
  updateUserValidation,
  changePasswordValidation,
  searchValidation
};