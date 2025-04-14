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

module.exports = { refreshVideojuego, obtenerVideojuegos };
