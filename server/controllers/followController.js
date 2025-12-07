// controllers/followController.js
const FollowService = require('../services/followService');
const { crearNotificacion } = require('./notificacionController');
const Persona = require('../models/Persona');

/**
 * Seguir a un usuario.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function followUser(req, res) {
  try {
    // El ID del usuario que realiza la acción se obtiene del token de autenticación
    const seguidorId = req.user && (req.user.id || req.user._id);
    // El ID del usuario a seguir se obtiene de los parámetros de la URL
    const seguidoId = req.params.userId;

    if (!seguidorId) {
      return res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción' });
    }

    const result = await FollowService.followUser(seguidorId, seguidoId);

    if (result.success) {
      const seguidor = await Persona.findById(seguidorId);
      if (seguidor) {
        const contenidoNotificacion = `${seguidor.nombre} ha empezado a seguirte.`;
        await crearNotificacion(
          seguidoId,
          'seguidor',
          contenidoNotificacion,
          { tipo: 'usuario', id: seguidorId },
          seguidorId
        );
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('[followUser] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Dejar de seguir a un usuario.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function unfollowUser(req, res) {
  try {
    const seguidorId = req.user && (req.user.id || req.user._id);
    const seguidoId = req.params.userId;

    if (!seguidorId) {
      return res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción' });
    }

    const result = await FollowService.unfollowUser(seguidorId, seguidoId);
    res.status(200).json(result);
  } catch (error) {
    console.error('[unfollowUser] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Obtener los seguidores de un usuario.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getSeguidores(req, res) {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const seguidores = await FollowService.getSeguidores(userId, { limit, page });
    res.status(200).json({
      success: true,
      count: seguidores.length,
      seguidores
    });
  } catch (error) {
    console.error('[getSeguidores] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Obtener los usuarios que sigue un usuario.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getSiguiendo(req, res) {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const siguiendo = await FollowService.getSiguiendo(userId, { limit, page });
    res.status(200).json({
      success: true,
      count: siguiendo.length,
      siguiendo
    });
  } catch (error) {
    console.error('[getSiguiendo] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Verificar si un usuario sigue a otro.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function checkFollowStatus(req, res) {
  try {
    const seguidorId = req.user && (req.user.id || req.user._id);
    const seguidoId = req.params.userId;

    if (!seguidorId) {
      return res.status(401).json({ error: 'Debes iniciar sesión para realizar esta acción' });
    }

    const isFollowing = await FollowService.isFollowing(seguidorId, seguidoId);
    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error('[checkFollowStatus] Error:', error);
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  followUser,
  unfollowUser,
  getSeguidores,
  getSiguiendo,
  checkFollowStatus
};