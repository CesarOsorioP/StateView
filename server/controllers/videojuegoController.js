// controllers/videojuegoController.js
const { saveVideojuegoFromRawg, searchVideojuegosEnRawg, saveVideojuegoById } = require('../services/videojuegoService');
const { invalidateVideojuegosCache } = require('../middlewares/cacheMiddleware');
const Videojuego = require('../models/Videojuego');
const mongoose = require('mongoose');

async function agregarVideojuegoPorId(req, res) {
  try {
    const { gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ error: 'Falta el parámetro "gameId"' });
    }
    const videojuego = await saveVideojuegoById(gameId);
    
    // Invalidar caché de videojuegos
    await invalidateVideojuegosCache();
    
    res.json({ message: 'Videojuego agregado correctamente', data: videojuego });
  } catch (error) {
    console.error('Error en agregarVideojuegoPorId:', error);
    res.status(500).json({ error: 'Error agregando el videojuego: ' + error.message });
  }
}

async function refreshVideojuego(req, res) {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Falta el parámetro "title"' });
    }
    const videojuego = await saveVideojuegoFromRawg(title);
    
    // Invalidar caché de videojuegos
    await invalidateVideojuegosCache();
    
    res.json({ message: 'Videojuego guardado desde RAWG API', data: videojuego });
  } catch (error) {
    res.status(500).json({ error: `Error actualizando el videojuego: ${error.message}` });
  }
}

async function obtenerVideojuegos(req, res) {
  try {
    const videojuegos = await Videojuego.find();
    res.json(videojuegos);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo los videojuegos: ${error.message}` });
  }
}

// Función para obtener la información de un videojuego individual por ID
async function obtenerVideojuegoPorId(req, res) {

  try {
    // Se asume que en tu modelo el campo único es 'game_id'
    const { gameId } = req.params;
    const videojuego = await Videojuego.findOne({ juego_id: gameId });
    console.log('ID de videojuego solicitado:', gameId);
    if (!videojuego) {
      return res.status(404).json({ error: 'Videojuego no encontrado' });
    }
    
    res.json(videojuego);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo el videojuego: ${error.message}` });
  }
}

async function eliminarVideojuego(req, res) {
  try {
    const { juegoId } = req.params;
    
    let juego = null;
    
    // Intentar por juego_id
    juego = await Videojuego.findOneAndDelete({ juego_id: juegoId });
    
    // Si no se encuentra, intentar por _id
    if (!juego && mongoose.Types.ObjectId.isValid(juegoId)) {
      juego = await Videojuego.findByIdAndDelete(juegoId);
    }

    if (!juego) {
      return res.status(404).json({ error: 'Videojuego no encontrado' });
    }
    
    // Invalidar caché de videojuegos
    await invalidateVideojuegosCache();
    
    res.json({ message: 'Videojuego eliminado correctamente', data: juego });
  } catch (error) {
    res.status(500).json({ error: `Error eliminando el videojuego: ${error.message}` });
  }
}

async function buscarVideojuegos(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere un término de búsqueda' 
      });
    }

    const videojuegos = await Videojuego.find({
      $or: [
        { titulo: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      success: true,
      data: videojuegos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

async function buscarVideojuegosEnRawg(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere un término de búsqueda' 
      });
    }

    const resultados = await searchVideojuegosEnRawg(query);
    res.json({
      success: true,
      data: resultados
    });
  } catch (error) {
    console.error('Error en buscarVideojuegosEnRawg:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

module.exports = { 
  refreshVideojuego, 
  obtenerVideojuegos, 
  obtenerVideojuegoPorId, 
  eliminarVideojuego,
  buscarVideojuegos,
  buscarVideojuegosEnRawg,
  agregarVideojuegoPorId // New export
};
