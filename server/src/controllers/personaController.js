const Persona = require('../models/Persona');
const notificacionController = require('./notificacionController');

// ... existing code ...

// Seguir a un usuario
exports.seguirUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioActual = await Persona.findById(req.user._id);
    const usuarioASeguir = await Persona.findById(id);

    if (!usuarioASeguir) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si ya sigue al usuario
    if (usuarioActual.seguidos.includes(id)) {
      return res.status(400).json({
        success: false,
        error: 'Ya sigues a este usuario'
      });
    }

    // Agregar a seguidos
    usuarioActual.seguidos.push(id);
    await usuarioActual.save();

    // Agregar a seguidores
    usuarioASeguir.seguidores.push(req.user._id);
    await usuarioASeguir.save();

    // Crear notificación para el usuario seguido
    await notificacionController.crearNotificacion(
      id,
      'seguidor',
      `${req.user.nombre} comenzó a seguirte`,
      {
        tipo: 'usuario',
        id: req.user._id
      },
      req.user._id
    );

    res.json({
      success: true,
      data: {
        seguidos: usuarioActual.seguidos,
        seguidores: usuarioASeguir.seguidores
      }
    });
  } catch (error) {
    console.error('Error al seguir usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al seguir usuario'
    });
  }
};

// ... existing code ... 