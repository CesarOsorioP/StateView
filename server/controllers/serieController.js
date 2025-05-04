const { saveSerieFromOMDb } = require('../services/serieService');
const Serie = require('../models/Serie');

/**
 * Endpoint para refrescar o agregar una serie desde OMDb API.
 * Ejemplo: GET /api/series/refresh?title=Breaking%20Bad
 */
async function refreshSerie(req, res) {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Falta el parámetro "title"' });
    }
    const serie = await saveSerieFromOMDb(title);
    res.json({ message: 'Serie guardada desde OMDb API', data: serie });
  } catch (error) {
    res.status(500).json({ error: `Error actualizando la serie: ${error.message}` });
  }
}

/**
 * Endpoint para obtener todas las series almacenadas.
 * Ejemplo: GET /api/series
 */
async function obtenerSeries(req, res) {
  try {
    const series = await Serie.find();
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo las series: ${error.message}` });
  }
}

module.exports = { refreshSerie, obtenerSeries };
