// routes/serieRoutes.js
const express = require('express');
const router = express.Router();
const { refreshSerie, obtenerSeries } = require('../controllers/serieController');

// Ruta para agregar/actualizar una serie mediante OMDb API
// Ejemplo: GET /api/series/refresh?title=Breaking%20Bad
router.get('/refresh', refreshSerie);

// Ruta para obtener el listado de series guardadas
router.get('/', obtenerSeries);

module.exports = router;
