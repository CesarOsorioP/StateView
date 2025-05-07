// routes/albumRoutes.js
const express = require('express');
const router = express.Router();
const { refreshAlbum, obtenerAlbumes, obtenerAlbumPorId , eliminarAlbum} = require('../controllers/albumController');

// Endpoint para agregar/actualizar un álbum (se requiere artist y album como parámetros)
router.get('/refresh', refreshAlbum);

// Endpoint para obtener todos los álbumes almacenados
router.get('/', obtenerAlbumes);

// Endpoint para obtener un álbum individual por su album_id
router.get('/:albumId', obtenerAlbumPorId);
router.delete('/:albumId', eliminarAlbum);

module.exports = router;
