// routes/videojuegoRoutes.js
const express = require('express');
const router = express.Router();
const { cacheVideojuegosMiddleware } = require('../middlewares/cacheMiddleware');
const { 
  refreshVideojuego, 
  obtenerVideojuegos, 
  obtenerVideojuegoPorId, 
  eliminarVideojuego,
  obtenerVideojuegoPorItemId,
  buscarVideojuegos,
  buscarVideojuegosEnRawg,
  agregarVideojuegoPorId
} = require('../controllers/videojuegoController');

// Endpoint para agregar videojuego por ID
router.post('/add-by-id', agregarVideojuegoPorId);

// Endpoint para buscar videojuegos en la API externa
router.get('/search-rawg', buscarVideojuegosEnRawg);

// Endpoint para buscar videojuegos en la base de datos (con caché - 30 min)
router.get('/buscar', cacheVideojuegosMiddleware(1800), buscarVideojuegos);

// Endpoint para actualizar/agregar un videojuego (sin caché - modifica datos)
router.get('/refresh', refreshVideojuego);

// Endpoint para obtener todos los videojuegos (con caché - 30 min)
router.get('/', cacheVideojuegosMiddleware(1800), obtenerVideojuegos);

// Endpoint para obtener un videojuego individual (con caché - 30 min)
router.get('/:gameId', cacheVideojuegosMiddleware(1800), obtenerVideojuegoPorId);

// Endpoint para eliminar un videojuego
router.delete('/:juegoId', eliminarVideojuego);

module.exports = router;
