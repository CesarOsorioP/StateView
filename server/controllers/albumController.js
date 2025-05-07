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

// Función adicional para obtener la información de un álbum individual
async function obtenerAlbumPorId(req, res) {
  try {
    // Se asume que en tu modelo el campo único es 'album_id'
    const { albumId } = req.params;
    const album = await Album.findOne({ album_id: albumId });
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: `Error obteniendo el álbum: ${error.message}` });
  }
}
async function eliminarAlbum(req, res) {
  try {
    const { albumId } = req.params;
    const album = await Album.findOneAndDelete({ album_id: albumId });
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }
    res.json({ message: 'Álbum eliminado correctamente', data: album });
  } catch (error) {
    res.status(500).json({ error: `Error eliminando el álbum: ${error.message}` });
  }
}

module.exports = { refreshAlbum, obtenerAlbumes, obtenerAlbumPorId, eliminarAlbum };
