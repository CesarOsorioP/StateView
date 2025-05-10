// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signUp, login, getCurrentUser } = require('../controllers/authController');

router.post('/signup', signUp);
router.post('/login', login);
// Endpoint para obtener el usuario actual
router.get('/me', getCurrentUser);

// Nuevas rutas para restablecimiento de contraseña
router.post('/olvide-contrasena', authController.requestPasswordReset);
router.get('/recuperar-contrasena/:token', authController.validateResetToken);
router.post('/recuperar-contrasena/:token', authController.resetPassword);

module.exports = router;
