// controllers/albumController.js
const { saveAlbumFromLastfm } = require('../services/albumService');
const Album = require('../models/Album');

async function refreshAlbum(req, res) {
  try {
    const { artist, album } = req.query;
    if (!artist || !album) {
      return res.status(400).json({ error: 'Faltan los parámetros "artist" y/o "album".' });
    }
    const albumGuardado = await saveAlbumFromLastfm(artist, album);
    res.json({ message: 'Álbum guardado desde Last.fm API', data: albumGuardado });
  } catch (error) {
    res.status(500).json({ error: `Error actualizando el álbum: ${error.message}` });
  }
}

async function obtenerAlbumes(req, res) {
  try {
    const albumes = await Album.find();
    res.json(albumes);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo los álbumes: ${error.message}` });
  }
}

module.exports = { refreshAlbum, obtenerAlbumes };
