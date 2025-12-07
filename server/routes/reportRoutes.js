const express = require('express');
const router = express.Router();
const {
  crearReporte,
  obtenerReportes,
  actualizarReporte,
  eliminarReporte,
  obtenerItemReportado
} = require('../controllers/reporteController');

// Ruta para crear un nuevo reporte
router.post('/', crearReporte);

// Ruta para obtener reportes (opcionalmente filtrando por estado)
router.get('/', obtenerReportes);

// Ruta para actualizar un reporte
router.put('/:id', actualizarReporte);

// (Opcional) Ruta para eliminar un reporte
router.delete('/:id', eliminarReporte);
// Ruta para obtener el ítem reportado (reseña o comentario) a partir del ID del reporte
router.get('/:id/item', obtenerItemReportado);
module.exports = router;
