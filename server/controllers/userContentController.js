const userContentService = require('../services/userContentService');

/**
 * Obtiene todas las reseñas de un usuario.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getUserReviews(req, res) {
  try {
    const userId = req.params.userId;
    const reviews = await userContentService.getUserReviews(userId);
    res.status(200).json({
      success: true,
      reseñas: reviews
    });
  } catch (error) {
    console.error('[getUserReviews] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Obtiene todos los comentarios de un usuario.
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 */
async function getUserComments(req, res) {
  try {
    const userId = req.params.userId;
    const comments = await userContentService.getUserComments(userId);
    res.status(200).json({
      success: true,
      comentarios: comments
    });
  } catch (error) {
    console.error('[getUserComments] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getUserReviews,
  getUserComments
}; 