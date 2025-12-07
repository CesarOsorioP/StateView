const express = require('express');
const router = express.Router();
const notificacionRoutes = require('./notificacionRoutes');

// Configuración de rutas
router.use('/api/notificaciones', notificacionRoutes);

module.exports = router; 