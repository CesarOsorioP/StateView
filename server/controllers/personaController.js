// controllers/personaController.js
const bcrypt = require('bcrypt');
const Persona = require('../models/Persona');

/**
 * Crea una nueva persona (registro).
 * Se espera recibir en el body: nombre, email, contraseña, (opcionalmente: imagenPerfil, rol, etc.).
 */
async function crearPersona(req, res) {
  try {
    const { nombre, email, contraseña, imagenPerfil, rol } = req.body;

    // Verificar si el email ya está registrado
    const personaExistente = await Persona.findOne({ email });
    if (personaExistente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const contraseñaHasheada = await bcrypt.hash(contraseña, saltRounds);

    // Crear el objeto de la nueva persona
    const nuevaPersona = new Persona({
      nombre,
      email,
      contraseña: contraseñaHasheada,
      imagenPerfil: imagenPerfil || '',
      rol: rol || 'Usuario' // Asigna 'Usuario' si no se especifica otro rol
    });

    await nuevaPersona.save();
    res.status(201).json({ message: 'Persona creada correctamente', data: nuevaPersona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene todas las personas registradas.
 */
async function obtenerPersonas(req, res) {
  try {
    const personas = await Persona.find();
    res.status(200).json({ data: personas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene una persona en particular según su ID.
 */
async function obtenerPersona(req, res) {
  try {
    const { id } = req.params;
    const persona = await Persona.findById(id);
    if (!persona) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.status(200).json({ data: persona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Edita la información de una persona.
 * Si se incluye una nueva contraseña, se encripta antes de guardar.
 */
async function editarPersona(req, res) {
  try {
    const { id } = req.params;
    const actualizacion = { ...req.body };

    // Si se actualiza la contraseña, tiene que volver a hashearse
    if (req.body.contraseña) {
      const saltRounds = 10;
      actualizacion.contraseña = await bcrypt.hash(req.body.contraseña, saltRounds);
    }

    const personaActualizada = await Persona.findByIdAndUpdate(id, actualizacion, { new: true });
    if (!personaActualizada) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.status(200).json({ message: 'Persona actualizada correctamente', data: personaActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Elimina una persona de la base de datos.
 */
async function eliminarPersona(req, res) {
  try {
    const { id } = req.params;
    const personaEliminada = await Persona.findByIdAndDelete(id);
    if (!personaEliminada) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.status(200).json({ message: 'Persona eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  crearPersona,
  obtenerPersonas,
  obtenerPersona,
  editarPersona,
  eliminarPersona
};
