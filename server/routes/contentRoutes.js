const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Ruta para exportar contenido a PDF
router.get('/export', 
  protect,
  restrictTo('Administrador', 'Superadministrador'),
  contentController.exportContent
);

module.exports = router; 