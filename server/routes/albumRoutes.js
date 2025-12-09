// routes/albumRoutes.js
const express = require('express');
const router = express.Router();
const { cacheAlbumesMiddleware } = require('../middlewares/cacheMiddleware');
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

// Endpoint para buscar álbumes en la base de datos (con caché - 30 min)
router.get('/buscar', cacheAlbumesMiddleware(1800), buscarAlbumes);

// Endpoint para actualizar/agregar un álbum (sin caché - modifica datos)
router.get('/refresh', refreshAlbum);

// Endpoint para obtener todos los álbumes (con caché - 30 min)
router.get('/', cacheAlbumesMiddleware(1800), obtenerAlbumes);

// Endpoint para obtener un álbum individual (con caché - 30 min)
router.get('/:albumId', cacheAlbumesMiddleware(1800), obtenerAlbumPorId);

// Endpoint para eliminar un álbum
router.delete('/:albumId', eliminarAlbum);

// Endpoint para obtener las preferencias del usuario para un álbum
router.get('/:id/preferences', getAlbumPreferences);

// Endpoint para actualizar las preferencias del usuario para un álbum
router.post('/:id/preferences', updateAlbumPreferences);

module.exports = router;
