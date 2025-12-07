// controllers/albumController.js
const { saveAlbumFromLastfm, searchAlbumsEnLastfm } = require('../services/albumService');
const Album = require('../models/Album');
const PersonaService = require('../services/personaService');
const AlbumService = require('../services/albumService');
const mongoose = require('mongoose');

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
    
    let albumEliminado = null;
    
    // Primero intentar borrar por album_id (external ID)
    albumEliminado = await Album.findOneAndDelete({ album_id: albumId });
    
    // Si no se encuentra, intentar borrar por _id (MongoDB ID)
    if (!albumEliminado && mongoose.Types.ObjectId.isValid(albumId)) {
      albumEliminado = await Album.findByIdAndDelete(albumId);
    }

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

async function buscarAlbumes(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere un término de búsqueda' 
      });
    }

    const albumes = await Album.find({
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { 'artista.nombre': { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      success: true,
      data: albumes
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Obtiene las preferencias del usuario para un álbum (si está en su historial).
 * Requiere autenticación.
 */
async function getAlbumPreferences(req, res) {
  try {
    const userId = req.user._id; // Asumiendo que el middleware de autenticación agrega req.user
    const albumId = req.params.id;
    const album = await AlbumService.obtenerAlbumPorId(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }
    const historial = await PersonaService.obtenerHistorial(userId);
    const isInHistorial = historial.some(item => item.contenido_id === albumId && item.tipo === 'Album');
    res.status(200).json({ isInHistorial });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualiza las preferencias del usuario para un álbum (agrega o quita del historial).
 * Requiere autenticación.
 */
async function updateAlbumPreferences(req, res) {
  try {
    const userId = req.user._id; // Asumiendo que el middleware de autenticación agrega req.user
    const albumId = req.params.id;
    const album = await AlbumService.obtenerAlbumPorId(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Álbum no encontrado' });
    }
    const { action } = req.body; // 'add' o 'remove'
    if (action === 'add') {
      await PersonaService.agregarHistorial(userId, { contenido_id: albumId, tipo: 'Album' });
    } else if (action === 'remove') {
      await PersonaService.quitarHistorial(userId, { contenido_id: albumId, tipo: 'Album' });
    } else {
      return res.status(400).json({ error: 'Acción no válida' });
    }
    res.status(200).json({ message: 'Preferencias actualizadas correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function buscarAlbumsEnLastfm(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere un término de búsqueda' 
      });
    }

    const resultados = await searchAlbumsEnLastfm(query);
    res.json({
      success: true,
      data: resultados
    });
  } catch (error) {
    console.error('Error en buscarAlbumsEnLastfm:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

module.exports = { 
  refreshAlbum, 
  obtenerAlbumes, 
  obtenerAlbumPorId, 
  eliminarAlbum,
  buscarAlbumes,
  getAlbumPreferences,
  updateAlbumPreferences,
  buscarAlbumsEnLastfm
};
