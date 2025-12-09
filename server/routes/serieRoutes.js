// routes/serieRoutes.js
const express = require('express');
const router = express.Router();
const { cacheSeriesMiddleware } = require('../middlewares/cacheMiddleware');
const { 
  refreshSerie, 
  obtenerSeries, 
  obtenerSeriePorId, 
  eliminarSerie,
  obtenerSeriePorItemId,
  buscarSeries,
  buscarSeriesEnOMDb,
  agregarSeriePorId
} = require('../controllers/serieController');

// Endpoint para agregar serie por IMDb ID
router.post('/add-by-id', agregarSeriePorId);

// Endpoint para buscar series en la API externa
router.get('/search-omdb', buscarSeriesEnOMDb);

// Endpoint para buscar series en la base de datos (con caché - 30 min)
router.get('/buscar', cacheSeriesMiddleware(1800), buscarSeries);

// Endpoint para actualizar/agregar una serie (sin caché - modifica datos)
router.get('/refresh', refreshSerie);

// Endpoint para obtener todas las series (con caché - 30 min)
router.get('/', cacheSeriesMiddleware(1800), obtenerSeries);

// Endpoint para obtener una serie individual (con caché - 30 min)
router.get('/:seriesId', cacheSeriesMiddleware(1800), obtenerSeriePorId);

// Endpoint para eliminar una serie
router.delete('/:seriesId', eliminarSerie);

module.exports = router;
