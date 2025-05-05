// routes/videojuegoRoutes.js
const express = require('express');
const router = express.Router();
const { refreshVideojuego, obtenerVideojuegos, obtenerVideojuegoPorId , eliminarVideojuego} = require('../controllers/videojuegoController');

// Endpoint para agregar/actualizar un videojuego usando RAWG API
// Ejemplo: GET /api/videojuegos/refresh?title=The%20Witcher%203
router.get('/refresh', refreshVideojuego);

// Endpoint para obtener todos los videojuegos almacenados
router.get('/', obtenerVideojuegos);

// Endpoint para obtener un álbum individual por su album_id
router.get('/:gameId', obtenerVideojuegoPorId);
router.delete('/:juegoId', eliminarVideojuego);

module.exports = router;
