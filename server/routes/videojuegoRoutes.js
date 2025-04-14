// routes/videojuegoRoutes.js
const express = require('express');
const router = express.Router();
const { refreshVideojuego, obtenerVideojuegos } = require('../controllers/videojuegoController');

// Endpoint para agregar/actualizar un videojuego usando RAWG API
// Ejemplo: GET /api/videojuegos/refresh?title=The%20Witcher%203
router.get('/refresh', refreshVideojuego);

// Endpoint para obtener todos los videojuegos almacenados
router.get('/', obtenerVideojuegos);

module.exports = router;
