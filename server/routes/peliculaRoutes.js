// routes/peliculaRoutes.js
const express = require('express');
const router = express.Router();
const { cachePeliculasMiddleware } = require('../middlewares/cacheMiddleware');
const { 
  refreshPelicula, 
  obtenerPeliculas, 
  obtenerPeliculaPorId, 
  eliminarPelicula, 
  obtenerPeliculaPorItemId,
  buscarPeliculas,
  buscarPeliculasEnOMDb,
  agregarPeliculaPorId
} = require('../controllers/peliculaController');

// Endpoint para agregar película por IMDb ID
router.post('/add-by-id', agregarPeliculaPorId);

// Endpoint para buscar películas en la API externa
router.get('/search-omdb', buscarPeliculasEnOMDb);

// Endpoint para buscar películas en la base de datos
router.get('/buscar', buscarPeliculas);

// Endpoint para actualizar/agregar una película
// Ejemplo: GET /api/peliculas/refresh?title=Inception
router.get('/refresh', refreshPelicula);

// Endpoint para obtener todas las películas almacenadas (con caché - 30 min)
router.get('/', cachePeliculasMiddleware(1800), obtenerPeliculas);

// Endpoint para obtener una película por itemId (_id de MongoDB)
// IMPORTANTE: Esta ruta debe ir antes de /:movieId para evitar conflictos
router.get('/by-item/:itemId', obtenerPeliculaPorItemId);

// Endpoint para obtener una película individual por 'movieId' (puede ser _id o pelicula_id)
router.get('/:movieId', obtenerPeliculaPorId);

// Endpoint para eliminar una película por 'movieId' (puede ser _id o pelicula_id)
router.delete('/:movieId', eliminarPelicula);

module.exports = router;
