// routes/peliculaRoutes.js
const express = require('express');
const router = express.Router();
const { refreshPelicula, obtenerPeliculas, obtenerPeliculaPorId } = require('../controllers/peliculaController');

// Endpoint para actualizar/agregar una película
// Ejemplo: GET /api/peliculas/refresh?title=Inception
router.get('/refresh', refreshPelicula);

// Endpoint para obtener todas las películas almacenadas
router.get('/', obtenerPeliculas);

router.get('/:movieId', obtenerPeliculaPorId);

module.exports = router;
