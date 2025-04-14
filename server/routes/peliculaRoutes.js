// routes/peliculaRoutes.js
const express = require('express');
const router = express.Router();
const { refreshPelicula, obtenerPeliculas } = require('../controllers/peliculaController');

// Endpoint para actualizar/agregar una película
// Ejemplo: GET /api/peliculas/refresh?title=Inception
router.get('/refresh', refreshPelicula);

// Endpoint para obtener todas las películas almacenadas
router.get('/', obtenerPeliculas);

module.exports = router;
