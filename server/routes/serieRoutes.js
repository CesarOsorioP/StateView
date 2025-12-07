// routes/serieRoutes.js
const express = require('express');
const router = express.Router();
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

// Endpoint para buscar series en la base de datos
router.get('/buscar', buscarSeries);

// Endpoint para actualizar/agregar una serie
router.get('/refresh', refreshSerie);

// Endpoint para obtener todas las series
router.get('/', obtenerSeries);

// Endpoint para obtener una serie individual
router.get('/:seriesId', obtenerSeriePorId);

// Endpoint para eliminar una serie
router.delete('/:seriesId', eliminarSerie);

module.exports = router;
