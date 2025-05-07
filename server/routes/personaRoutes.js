const express = require('express');
const router = express.Router();

// Importa correctamente las funciones desde el controlador
const {
  crearPersona,
  obtenerPersonas,
  obtenerPersona,
  editarPersona,
  eliminarPersona
} = require('../controllers/personaController');

// Ruta para crear una nueva persona (Sign Up o registro)
router.post('/', crearPersona);

// Ruta para obtener todas las personas registradas
router.get('/', obtenerPersonas);

// Ruta para obtener los datos de una persona específica (por su ID)
router.get('/:id', obtenerPersona);

// Ruta para editar la información de una persona (actualización)
router.put('/:id', editarPersona);

// Ruta para eliminar a una persona
router.delete('/:id', eliminarPersona);

module.exports = router;
