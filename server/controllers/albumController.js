// controllers/albumController.js
const { saveAlbumFromLastfm } = require('../services/albumService');
const Album = require('../models/Album');

/**
 * Refresca (o crea) un álbum utilizando datos de la API de Last.fm.
 * Se esperan los parámetros "artist" y "album" en la query string.
 * Al finalizar, emite el evento 'contentStats' con el nuevo total de álbumes.
 */
async function refreshAlbum(req, res) {
  try {
    const { artist, album } = req.query;
    if (!artist || !album) {
      return res.status(400).json({ error: 'Faltan los parámetros "artist" y/o "album".' });
    }
    const albumGuardado = await saveAlbumFromLastfm(artist, album);

    // Emitir actualización del dashboard de contenido
    if (req.io) {
      const albumCount = await Album.countDocuments();
      req.io.of('/dashboard/content').emit('contentStats', { albums: albumCount });
    }
    res.status(200).json({ message: 'Álbum guardado desde Last.fm API', data: albumGuardado });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error actualizando el álbum: ${error.message}` });
  }
}

/**
 * Obtiene todos los álbumes almacenados.
 */
async function obtenerAlbumes(req, res) {
  try {
    const albumes = await Album.find();
    res.status(200).json({ data: albumes });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error obteniendo los álbumes: ${error.message}` });
  }
}

/**
 * Obtiene la información de un álbum individual según su ID.
 * Se asume que en el modelo el campo único es 'album_id'.
 */
async function obtenerAlbumPorId(req, res) {
  try {
    const { albumId } = req.params;
    const album = await Album.findOne({ album_id: albumId });
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado.' });
    }
    res.status(200).json({ data: album });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error obteniendo el álbum: ${error.message}` });
  }
}

/**
 * Elimina un álbum según su ID.
 * Una vez eliminado, se recalcula el total de álbumes y se emite el evento para actualizar el dashboard.
 */
async function eliminarAlbum(req, res) {
  try {
    const { albumId } = req.params;
    const albumEliminado = await Album.findOneAndDelete({ album_id: albumId });
    if (!albumEliminado) {
      return res.status(404).json({ error: 'Álbum no encontrado.' });
    }
    // Emitir actualización del dashboard de contenido
    if (req.io) {
      const albumCount = await Album.countDocuments();
      req.io.of('/dashboard/content').emit('contentStats', { albums: albumCount });
    }
    res
      .status(200)
      .json({ message: 'Álbum eliminado correctamente', data: albumEliminado });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error eliminando el álbum: ${error.message}` });
  }
}

module.exports = { refreshAlbum, obtenerAlbumes, obtenerAlbumPorId, eliminarAlbum };
