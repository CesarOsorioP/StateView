// routes/videojuegoRoutes.js
const express = require('express');
const router = express.Router();
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

// Endpoint para buscar videojuegos en la base de datos
router.get('/buscar', buscarVideojuegos);

// Endpoint para actualizar/agregar un videojuego
router.get('/refresh', refreshVideojuego);

// Endpoint para obtener todos los videojuegos
router.get('/', obtenerVideojuegos);

// Endpoint para obtener un videojuego individual
router.get('/:gameId', obtenerVideojuegoPorId);

// Endpoint para eliminar un videojuego
router.delete('/:juegoId', eliminarVideojuego);

module.exports = router;
