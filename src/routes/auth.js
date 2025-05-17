// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');

// POST /api/auth/register - Register a new user
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login - Login a user
router.post('/login', loginValidation, authController.login);

module.exports = router;