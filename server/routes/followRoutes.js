// routes/followRoutes.js
const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { protect } = require('../middlewares/authMiddleware'); // Importa la función protect

// Ruta para seguir a un usuario
router.post('/users/:userId/follow', protect, followController.followUser);

// Ruta para dejar de seguir a un usuario
router.delete('/users/:userId/unfollow', protect, followController.unfollowUser);

// Ruta para obtener los seguidores de un usuario (sin autenticación si se necesita)
router.get('/users/:userId/seguidores', followController.getSeguidores);

// Ruta para obtener los usuarios que sigue un usuario (sin autenticación si se necesita)
router.get('/users/:userId/siguiendo', followController.getSiguiendo);

// Ruta para verificar si un usuario sigue a otro
router.get('/users/:userId/follow-status', protect, followController.checkFollowStatus);

module.exports = router;
