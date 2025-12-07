const express = require('express');
const router = express.Router();

// Importa correctamente las funciones desde el controlador
const {
  crearPersona,
  obtenerPersonas,
  obtenerPersona,
  editarPersona,
  actualizarEstadoPersona,
  agregarHistorial,
  quitarHistorial,
  obtenerHistorial,
  agregarMeGusta,
  quitarMeGusta,
  obtenerMeGusta
} = require('../controllers/personaController');

// Ruta para crear una nueva persona (Sign Up o registro)
router.post('/', crearPersona);

// Ruta para obtener todas las personas registradas
router.get('/', obtenerPersonas);

// Ruta para obtener los datos de una persona específica (por su ID)
router.get('/:id', obtenerPersona);

// Ruta para editar la información de una persona (actualización)
router.put('/:id', editarPersona);

// Ruta para actualizar el estado de una persona a cualquiera de los valores definidos
router.put('/:id/estado', actualizarEstadoPersona);

// Historial (visto/escuchado)
router.post('/:id/historial', agregarHistorial);
router.delete('/:id/historial', quitarHistorial);
router.get('/:id/historial', obtenerHistorial);

// Me gusta
router.post('/:id/megusta', agregarMeGusta);
router.delete('/:id/megusta', quitarMeGusta);
router.get('/:id/megusta', obtenerMeGusta);

module.exports = router;
