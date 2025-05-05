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

// Función para obtener la información de una película individual por ID
async function obtenerPeliculaPorId(req, res) {
  try {
    // Se asume que en tu modelo el campo único es 'pelicula_id'
    const { movieId } = req.params;
    const pelicula = await Pelicula.findOne({ pelicula_id: movieId });
    console.log('ID de película solicitada:', movieId);
    if (!pelicula) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }
    
    res.json(pelicula);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo la película: ${error.message}` });
  }
}

module.exports = { refreshPelicula, obtenerPeliculas, obtenerPeliculaPorId };
