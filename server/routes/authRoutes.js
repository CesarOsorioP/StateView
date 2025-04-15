// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signUp, login, getCurrentUser } = require('../controllers/authController');

router.post('/signup', signUp);
router.post('/login', login);
// Endpoint para obtener el usuario actual
router.get('/me', getCurrentUser);

module.exports = router;
