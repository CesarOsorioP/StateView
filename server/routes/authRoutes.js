// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signUp, login, getCurrentUser, requestPasswordReset, validateResetToken, resetPassword } = require('../controllers/authController');

router.post('/signup', signUp);
router.post('/login', login);
// Endpoint para obtener el usuario actual
router.get('/me', getCurrentUser);

// Nuevas rutas para restablecimiento de contraseña
router.post('/olvide-contrasena', requestPasswordReset);
router.get('/recuperar-contrasena/:token', validateResetToken);
router.post('/recuperar-contrasena/:token', resetPassword);

module.exports = router;
