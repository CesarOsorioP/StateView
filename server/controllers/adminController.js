// controllers/adminController.js
const Persona = require('../models/Persona');

// Función para crear un nuevo administrador
const crearAdministrador = async (req, res) => {
  try {
    const { nombre, email, contraseña, imagenPerfil } = req.body;
    // Se asume que se realiza el hash de la contraseña en un middleware o aquí mismo.
    const nuevoAdmin = new Persona({
      nombre,
      email,
      contraseña,
      imagenPerfil,
      rol: 'Administrador'
    });
    await nuevoAdmin.save();
    res.status(201).json({ message: 'Administrador creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Función para editar la información de un moderador
const editarModerador = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const moderadorActualizado = await Persona.findByIdAndUpdate(id, updateData, { new: true });
    if (!moderadorActualizado) {
      return res.status(404).json({ error: 'Moderador no encontrado' });
    }
    res.status(200).json({ message: 'Moderador actualizado correctamente', moderador: moderadorActualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearAdministrador,
  editarModerador,
};
