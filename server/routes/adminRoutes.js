// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Ruta para que un administrador cree a otro administrador
router.post('/crear', protect, restrictTo('Administrador'), adminController.crearAdministrador);

// Ruta para que un administrador edite la información de un moderador
router.put('/moderador/:id', protect, restrictTo('Administrador'), adminController.editarModerador);

module.exports = router;
