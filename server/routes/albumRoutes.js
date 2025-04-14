// routes/albumRoutes.js
const express = require('express');
const router = express.Router();
const { refreshAlbum, obtenerAlbumes } = require('../controllers/albumController');

// Endpoint para agregar/actualizar un álbum (se requiere artist y album como parámetros)
router.get('/refresh', refreshAlbum);

// Endpoint para obtener todos los álbumes almacenados
router.get('/', obtenerAlbumes);

module.exports = router;
