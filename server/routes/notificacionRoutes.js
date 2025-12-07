const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { protect } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener notificaciones del usuario
router.get('/', notificacionController.getNotificaciones);

// Obtener cantidad de notificaciones no leídas
router.get('/no-leidas', notificacionController.getNotificacionesNoLeidas);

// Marcar una notificación como leída
router.put('/:id/leer', notificacionController.marcarLeida);

// Marcar todas las notificaciones como leídas
router.put('/leer-todas', notificacionController.marcarTodasLeidas);

// Ruta para crear una notificación de prueba (temporal)
router.post('/test', notificacionController.createTestNotification);

module.exports = router; 