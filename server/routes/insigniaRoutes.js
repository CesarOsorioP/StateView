const express = require('express');
const router = express.Router();
const { 
  crearInsignia, 
  listarInsignias, 
  asignarInsignia, 
  quitarInsignia, 
  listarInsigniasUsuario,
  editarInsignia,
  eliminarInsignia,
  obtenerInsignia
} = require('../controllers/insigniaController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Rutas públicas
router.get('/', listarInsignias);
router.get('/usuario/:userId', listarInsigniasUsuario);
router.get('/:id', obtenerInsignia);

// Rutas protegidas
router.post('/crear', protect, restrictTo('Administrador', 'Superadministrador'), upload.single('imagen'), crearInsignia);
router.post('/asignar', protect, restrictTo('Moderador', 'Administrador', 'Superadministrador'), asignarInsignia);
router.post('/quitar', protect, restrictTo('Moderador', 'Administrador', 'Superadministrador'), quitarInsignia);
router.put('/:id', protect, restrictTo('Administrador', 'Superadministrador'), upload.single('imagen'), editarInsignia);
router.delete('/:id', protect, restrictTo('Administrador', 'Superadministrador'), eliminarInsignia);

module.exports = router; 