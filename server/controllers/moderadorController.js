// controllers/moderadorController.js
const Persona = require('../models/Persona');

// EDITAR INFORMACIÓN DEL USUARIO
const editarInformacionUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const usuarioActualizado = await Persona.findByIdAndUpdate(id, updateData, { new: true });
    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Información del usuario actualizada', usuario: usuarioActualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GESTIONAR ADVERTENCIAS
const gestionarAdvertencias = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario al que se le gestiona la advertencia
    res.status(200).json({ message: `Advertencia gestionada para el usuario ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ENVIAR ADVERTENCIA A USUARIOS REPORTADOS
const enviarAdvertencia = async (req, res) => {
  try {
    const { id } = req.params; // Usuario reportado
    res.status(200).json({ message: `Advertencia enviada al usuario ${id}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// RESTRINGIR CUENTA DE USUARIO
const restringirCuentaUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioRestringido = await Persona.findByIdAndUpdate(id, { estado: 'Restringido' }, { new: true });
    if (!usuarioRestringido) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Cuenta restringida correctamente', usuario: usuarioRestringido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  editarInformacionUsuario,
  gestionarAdvertencias,
  enviarAdvertencia,
  restringirCuentaUsuario,
};
