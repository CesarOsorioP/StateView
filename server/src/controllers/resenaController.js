const Resena = require('../models/Resena');
const notificacionController = require('./notificacionController');

// Dar like a una reseña
exports.darLike = async (req, res) => {
  try {
    const { id } = req.params;
    const resena = await Resena.findById(id);

    if (!resena) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada'
      });
    }

    // Verificar si el usuario ya dio like
    if (resena.likes.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        error: 'Ya has dado like a esta reseña'
      });
    }

    resena.likes.push(req.user._id);
    await resena.save();

    // Crear notificación para el autor de la reseña
    if (resena.autor.toString() !== req.user._id.toString()) {
      await notificacionController.crearNotificacion(
        resena.autor,
        'like',
        `${req.user.nombre} dio like a tu reseña`,
        {
          tipo: 'reseña',
          id: resena._id
        },
        req.user._id
      );
    }

    res.json({
      success: true,
      data: resena
    });
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({
      success: false,
      error: 'Error al dar like a la reseña'
    });
  }
};

// Comentar una reseña
exports.comentar = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;

    const resena = await Resena.findById(id);

    if (!resena) {
      return res.status(404).json({
        success: false,
        error: 'Reseña no encontrada'
      });
    }

    const comentario = {
      autor: req.user._id,
      contenido,
      fecha: new Date()
    };

    resena.comentarios.push(comentario);
    await resena.save();

    // Crear notificación para el autor de la reseña
    if (resena.autor.toString() !== req.user._id.toString()) {
      await notificacionController.crearNotificacion(
        resena.autor,
        'comentario',
        `${req.user.nombre} comentó tu reseña`,
        {
          tipo: 'reseña',
          id: resena._id
        },
        req.user._id
      );
    }

    res.json({
      success: true,
      data: resena
    });
  } catch (error) {
    console.error('Error al comentar:', error);
    res.status(500).json({
      success: false,
      error: 'Error al comentar la reseña'
    });
  }
}; 