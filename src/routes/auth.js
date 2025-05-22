// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth'); // Assurez-vous d'avoir ce middleware


// POST /api/auth/register - Register a new user
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login - Login a user
router.post('/login', loginValidation, authController.login);

router.get('/me', authMiddleware, authController.getMe); // Protéger cette route

module.exports = router;