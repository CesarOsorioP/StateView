const Notificacion = require('../models/Notificacion');
const Persona = require('../models/Persona');

// Obtener todas las notificaciones de un usuario
exports.getNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: req.user._id })
      .sort({ fecha: -1 })
      .populate('emisor', 'nombre imagenPerfil')
      .limit(50);

    res.json({
      success: true,
      data: notificaciones
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificaciones'
    });
  }
};

// Marcar notificación como leída
exports.marcarLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const notificacion = await Notificacion.findOneAndUpdate(
      { _id: id, usuario: req.user._id },
      { leida: true },
      { new: true }
    );

    if (!notificacion) {
      return res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      data: notificacion
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar notificación como leída'
    });
  }
};

// Marcar todas las notificaciones como leídas
exports.marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.updateMany(
      { usuario: req.user._id, leida: false },
      { leida: true }
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones han sido marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar todas las notificaciones como leídas'
    });
  }
};

// Obtener cantidad de notificaciones no leídas
exports.getNotificacionesNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.countDocuments({
      usuario: req.user._id,
      leida: false
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error al obtener cantidad de notificaciones no leídas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cantidad de notificaciones no leídas'
    });
  }
};

// Función auxiliar para crear notificaciones
exports.crearNotificacion = async (usuarioId, tipo, contenido, referencia, emisorId) => {
  try {
    const notificacion = new Notificacion({
      usuario: usuarioId,
      tipo,
      contenido,
      referencia,
      emisor: emisorId
    });

    await notificacion.save();
    return notificacion;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
}; 