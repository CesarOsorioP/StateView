// routes/albumRoutes.js
const express = require('express');
const router = express.Router();
const { 
  refreshAlbum, 
  obtenerAlbumes, 
  obtenerAlbumPorId, 
  eliminarAlbum,
  obtenerAlbumPorItemId,
  buscarAlbumes,
  getAlbumPreferences,
  updateAlbumPreferences,
  buscarAlbumsEnLastfm
} = require('../controllers/albumController');

// Endpoint para buscar álbumes en la API externa
router.get('/search-lastfm', buscarAlbumsEnLastfm);

// Endpoint para buscar álbumes en la base de datos
router.get('/buscar', buscarAlbumes);

// Endpoint para actualizar/agregar un álbum
router.get('/refresh', refreshAlbum);

// Endpoint para obtener todos los álbumes
router.get('/', obtenerAlbumes);

// Endpoint para obtener un álbum individual
router.get('/:albumId', obtenerAlbumPorId);

// Endpoint para eliminar un álbum
router.delete('/:albumId', eliminarAlbum);

// Endpoint para obtener las preferencias del usuario para un álbum
router.get('/:id/preferences', getAlbumPreferences);

// Endpoint para actualizar las preferencias del usuario para un álbum
router.post('/:id/preferences', updateAlbumPreferences);

module.exports = router;
