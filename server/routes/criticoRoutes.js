// routes/criticoRoutes.js
const express = require('express');
const router = express.Router();
const criticoController = require('../controllers/criticoController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Se aplica protect y restrictTo de forma global a estas rutas
router.use(protect);
router.use(restrictTo('Critico', 'Moderador', 'Administrador'));

// Rutas para la gestión de reseñas:
router.post('/resenas', criticoController.crearResena);
router.put('/resenas/:resenaId', criticoController.editarResena);
router.delete('/resenas/:resenaId', criticoController.eliminarResena);

// Ruta para comentar en reseñas:
router.post('/resenas/:resenaId/comentarios', criticoController.comentarEnResena);

// Ruta para interactuar con likes en reseñas/comentarios:
router.post('/items/:itemId/likes', criticoController.interactuarConLikes);

// Ruta para crear listas:
router.post('/listas', criticoController.crearLista);

// Ruta para buscar contenido:
router.get('/buscar', criticoController.buscarContenido);

// Ruta para calificar contenido:
router.post('/items/:itemId/calificar', criticoController.calificarContenido);

// Ruta para marcar contenido (visto o pendiente):
router.post('/items/:itemId/marcar', criticoController.marcarContenido);

// Ruta para seguir a otros usuarios:
router.post('/usuarios/:idUsuario/seguir', criticoController.seguirUsuario);

// Ruta para escribir reseñas largas:
router.post('/resenas/larga', criticoController.escribirResenaLarga);

// Ruta para mostrar insignias exclusivas del crítico:
router.get('/insignias/:id', criticoController.mostrarInsigniasCritico);

module.exports = router;
