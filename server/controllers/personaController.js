// controllers/personaController.js
const PersonaService = require('../services/personaService');

/**
 * Crea una nueva Persona.
 */
async function crearPersona(req, res) {
  try {
    const nuevaPersona = await PersonaService.crearPersona(req.body);
    res.status(201).json({ message: 'Persona creada correctamente', data: nuevaPersona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene todas las Personas.
 */
async function obtenerPersonas(req, res) {
  try {
    const personas = await PersonaService.obtenerPersonas();
    res.status(200).json({ data: personas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene una Persona por su ID.
 */
async function obtenerPersona(req, res) {
  try {
    const persona = await PersonaService.obtenerPersonaPorId(req.params.id);
    res.status(200).json({ data: persona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Edita o actualiza la información de una Persona.
 */
async function editarPersona(req, res) {
  try {
    const personaActualizada = await PersonaService.editarPersona(req.params.id, req.body);
    res.status(200).json({ message: 'Persona actualizada correctamente', data: personaActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualiza el estado de una Persona.
 */
async function actualizarEstadoPersona(req, res) {
  try {
    const personaActualizada = await PersonaService.actualizarEstadoPersona(req.params.id, req.body.estado);
    res.status(200).json({ message: 'Estado actualizado correctamente', data: personaActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  crearPersona,
  obtenerPersonas,
  obtenerPersona,
  editarPersona,
  actualizarEstadoPersona,
};
