// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signUp, login } = require('../controllers/authController');

// Endpoint para registro de usuario
// Ejemplo: POST /api/auth/signup
router.post('/signup', signUp);

// Endpoint para iniciar sesión
// Ejemplo: POST /api/auth/login
router.post('/login', login);

module.exports = router;
