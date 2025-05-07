// routes/moderadorRoutes.js
const express = require('express');
const router = express.Router();
const moderadorController = require('../controllers/moderadorController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Ruta para editar información de un usuario (acceso para moderadores o administradores)
router.put('/usuarios/:id', protect, restrictTo('Moderador', 'Administrador'), moderadorController.editarInformacionUsuario);

router.put('/usuarios/:id/advertencia', protect, restrictTo('Moderador', 'Administrador'), moderadorController.gestionarAdvertencias);

router.post('/usuarios/:id/advertencia', protect, restrictTo('Moderador', 'Administrador'), moderadorController.enviarAdvertencia);

router.put('/usuarios/:id/restringir', protect, restrictTo('Moderador', 'Administrador'), moderadorController.restringirCuentaUsuario);

module.exports = router;
