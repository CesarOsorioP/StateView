const express = require('express');
const router = express.Router();
const userContentController = require('../controllers/userContentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Ruta para obtener las reseñas de un usuario
router.get('/:userId/resenas', userContentController.getUserReviews);

// Ruta para obtener los comentarios de un usuario
router.get('/:userId/comentarios', userContentController.getUserComments);

module.exports = router; 