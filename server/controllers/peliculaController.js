// controllers/peliculaController.js
const { savePeliculaFromOMDb } = require('../services/peliculaService');
const Pelicula = require('../models/Pelicula');
const mongoose = require('mongoose');

async function refreshPelicula(req, res) {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Falta el parámetro "title"' });
    }
    const pelicula = await savePeliculaFromOMDb(title);
    res.json({ message: 'Película guardada desde OMDb API', data: pelicula });
  } catch (error) {
    console.error('Error en refreshPelicula:', error);
    res.status(500).json({ error: 'Error actualizando la película: ' + error.message });
  }
}

async function obtenerPeliculas(req, res) {
  try {
    const peliculas = await Pelicula.find();
    res.json(peliculas);
  } catch (error) {
    console.error('Error en obtenerPeliculas:', error);
    res.status(500).json({ error: 'Error obteniendo las películas: ' + error.message });
  }
}

// Función para obtener la información de una película individual por ID
async function obtenerPeliculaPorId(req, res) {
  try {
    const { movieId } = req.params;
    console.log('Buscando película con ID:', movieId);

    let pelicula = null;

    // Primero intentar buscar por pelicula_id (IMDB ID)
    pelicula = await Pelicula.findOne({ pelicula_id: movieId });
    console.log('Búsqueda por pelicula_id:', pelicula ? 'encontrada' : 'no encontrada');

    // Si no se encuentra por pelicula_id, intentar por _id (MongoDB ID)
    if (!pelicula) {
      try {
        const objectId = new mongoose.Types.ObjectId(movieId);
        pelicula = await Pelicula.findById(objectId);
        console.log('Búsqueda por _id:', pelicula ? 'encontrada' : 'no encontrada');
      } catch (error) {
        console.log('Error al convertir a ObjectId:', error.message);
      }
    }

    if (!pelicula) {
      console.log('Película no encontrada');
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    console.log('Película encontrada:', pelicula.titulo);
    res.json(pelicula);
  } catch (error) {
    console.error('Error en obtenerPeliculaPorId:', error);
    res.status(500).json({ error: `Error obteniendo la película: ${error.message}` });
  }
}

// Controlador para eliminar una película por ID
async function eliminarPelicula(req, res) {
  try {
    const { movieId } = req.params;
    console.log('Intentando eliminar película con ID:', movieId);

    let pelicula = null;

    // Primero intentar buscar por pelicula_id
    pelicula = await Pelicula.findOne({ pelicula_id: movieId });
    
    // Si no se encuentra, intentar por _id
    if (!pelicula) {
      try {
        const objectId = new mongoose.Types.ObjectId(movieId);
        pelicula = await Pelicula.findById(objectId);
      } catch (error) {
        console.log('Error al convertir a ObjectId:', error.message);
      }
    }

    if (!pelicula) {
      console.log('Película no encontrada para eliminar');
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    await Pelicula.deleteOne({ _id: pelicula._id });
    console.log('Película eliminada:', pelicula.titulo);
    
    res.json({ message: 'Película eliminada correctamente', data: pelicula });
  } catch (error) {
    console.error('Error en eliminarPelicula:', error);
    res.status(500).json({ error: 'Error eliminando la película: ' + error.message });
  }
}

// Endpoint para obtener la película por itemId (_id de MongoDB)
async function obtenerPeliculaPorItemId(req, res) {
  try {
    const { itemId } = req.params;
    console.log('Buscando película por itemId:', itemId);

    let pelicula = null;

    // Intentar buscar por _id
    try {
      const objectId = new mongoose.Types.ObjectId(itemId);
      pelicula = await Pelicula.findById(objectId);
    } catch (error) {
      console.log('Error al convertir a ObjectId:', error.message);
    }

    // Si no se encuentra por _id, intentar por pelicula_id
    if (!pelicula) {
      pelicula = await Pelicula.findOne({ pelicula_id: itemId });
    }

    if (!pelicula) {
      console.log('Película no encontrada por itemId');
      return res.status(404).json({ error: 'Película no encontrada por itemId' });
    }

    console.log('Película encontrada por itemId:', pelicula.titulo);
    res.json(pelicula);
  } catch (error) {
    console.error('Error en obtenerPeliculaPorItemId:', error);
    res.status(500).json({ error: `Error obteniendo la película por itemId: ${error.message}` });
  }
}

module.exports = { 
  refreshPelicula, 
  obtenerPeliculas, 
  obtenerPeliculaPorId, 
  eliminarPelicula,
  obtenerPeliculaPorItemId
};
