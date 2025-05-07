// routes/peliculaRoutes.js
const express = require('express');
const router = express.Router();
const { refreshPelicula, obtenerPeliculas, obtenerPeliculaPorId, eliminarPelicula } = require('../controllers/peliculaController');

// Endpoint para actualizar/agregar una película
// Ejemplo: GET /api/peliculas/refresh?title=Inception
router.get('/refresh', refreshPelicula);

// Endpoint para obtener todas las películas almacenadas
router.get('/', obtenerPeliculas);

// Endpoint para obtener una película individual por 'movieId'
router.get('/:movieId', obtenerPeliculaPorId);

// Endpoint para eliminar una película por 'movieId'
router.delete('/:movieId', eliminarPelicula);

module.exports = router;
