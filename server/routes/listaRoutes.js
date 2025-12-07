const express = require('express');
const router = express.Router();
const listaController = require('../controllers/listaController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/publicas', listaController.obtenerListasPublicas);

// Rutas protegidas (requieren autenticación)
router.get('/', protect, listaController.obtenerListasPorUsuario);
router.post('/', protect, listaController.crearLista);
router.get('/usuario/:usuarioId', protect, listaController.obtenerListasPorUsuario);

// Rutas con parámetros (deben ir después de las rutas específicas)
router.get('/:id', protect, listaController.obtenerListaPorId);
router.put('/:id', protect, listaController.actualizarLista);
router.delete('/:id', protect, listaController.eliminarLista);
router.post('/:id/elementos', protect, listaController.agregarElemento);
router.delete('/:id/elementos/:elementoId', protect, listaController.eliminarElemento);
router.put('/:id/visibilidad', protect, listaController.cambiarVisibilidad);

module.exports = router;
