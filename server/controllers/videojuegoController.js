// controllers/videojuegoController.js
const { saveVideojuegoFromRawg } = require('../services/videojuegoService');
const Videojuego = require('../models/Videojuego');

async function refreshVideojuego(req, res) {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Falta el parámetro "title"' });
    }
    const videojuego = await saveVideojuegoFromRawg(title);
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
    const juego = await Videojuego.findOneAndDelete({ juego_id: juegoId });
    if (!juego) {
      return res.status(404).json({ error: 'Videojuego no encontrado' });
    }
    res.json({ message: 'Videojuego eliminado correctamente', data: juego });
  } catch (error) {
    res.status(500).json({ error: `Error eliminando el videojuego: ${error.message}` });
  }
}

module.exports = { refreshVideojuego, obtenerVideojuegos, obtenerVideojuegoPorId, eliminarVideojuego};
