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

async function obtenerSeriePorId(req, res) {
  try {
    // Se asume que en tu modelo el campo único es 'series_id'
    const { seriesId } = req.params;
    const serie = await Serie.findOne({ serie_id: seriesId });
    console.log('ID de serie solicitado:', seriesId);
    if (!serie) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }
    res.json(serie);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo la serie: ${error.message}` });
  }
}


async function eliminarSerie(req, res) {
  try {
    const { serieId } = req.params;
    const serie = await Serie.findOneAndDelete({ serie_id: serieId });
    if (!serie) {
      return res.status(404).json({ error: 'Serie no encontrada' });
    }
    res.json({ message: 'Serie eliminada correctamente', data: serie });
  } catch (error) {
    res.status(500).json({ error: `Error eliminando la serie: ${error.message}` });
  }
}

module.exports = { refreshSerie, obtenerSeries, obtenerSeriePorId, eliminarSerie};
