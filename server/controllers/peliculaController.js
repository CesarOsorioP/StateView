// controllers/peliculaController.js
const { savePeliculaFromOMDb } = require('../services/peliculaService');
const Pelicula = require('../models/Pelicula');

async function refreshPelicula(req, res) {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Falta el parámetro "title"' });
    }
    const pelicula = await savePeliculaFromOMDb(title);
    res.json({ message: 'Película guardada desde OMDb API', data: pelicula });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando la película: ' + error.message });
  }
}

async function obtenerPeliculas(req, res) {
  try {
    const peliculas = await Pelicula.find();
    res.json(peliculas);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo las películas: ' + error.message });
  }
}

module.exports = { refreshPelicula, obtenerPeliculas };
