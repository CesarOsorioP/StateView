const express = require('express');
const router = express.Router();
const contenidoController = require('../controllers/contenidoController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/buscar', contenidoController.buscarContenido);
router.get('/:id', contenidoController.obtenerContenidoPorId);

module.exports = router;
