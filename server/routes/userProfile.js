const express = require('express');
const router = express.Router();
const Persona = require('../models/Persona');

// Get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = await Persona.findOne({ nombre: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Remove sensitive information
    const userProfile = {
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      imagenPerfil: user.imagenPerfil,
      imagenBanner: user.imagenBanner,
      insignias: user.insignias,
      seguidores: user.seguidores,
      siguiendo: user.siguiendo,
      listas: user.listas,
      _id: user._id
    };

    res.json({ data: userProfile });
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
  }
});

module.exports = router; 