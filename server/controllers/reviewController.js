// controllers/reviewController.js
const ReviewService = require('../services/reviewService');
const { invalidateReviewsCache } = require('../middlewares/cacheMiddleware');
const Persona = require('../models/Persona');

async function getDisplayName(user) {
  if (!user) return 'Usuario';
  const direct = user.username || user.nombre;
  if (direct) return direct;
  // Si no viene en req.user, intentar obtener desde la BD
  try {
    const persona = await Persona.findById(user.id || user._id);
    if (persona) {
      return persona.username || persona.nombre || persona.email || 'Usuario';
    }
  } catch (e) {
    // fallback silencioso
  }
  return user.email || 'Usuario';
}

/**
 * Crea una reseña utilizando el ReviewService.
 * Se espera recibir en el body de la petición: itemId, review_txt, rating y onModel.
 * El userId se obtiene del token de autenticación.
 */
async function createReview(req, res) {
  try {
    // Obtener el ID del usuario del token
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Crear el objeto de datos para la reseña
    const reviewData = {
      ...req.body,
      userId
    };

    const result = await ReviewService.createReview(reviewData);
    
    // Invalidar caché de reviews
    await invalidateReviewsCache();
    
    res.status(201).json({
      message: 'Reseña creada exitosamente.',
      review: result.review,
      updatedItem: result.updatedItem
    });
  } catch (error) {
    console.error('[createReview] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene las reseñas. Si se recibe itemId y onModel en req.query se filtra por ese ítem.
 */
async function getReviews(req, res) {
  try {
    const reviews = await ReviewService.getReviews(req.query);
    res.status(200).json(reviews);
  } catch (error) {
    console.error('[getReviews] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualiza una reseña.
 * Se espera que req.params.reviewId contenga el ID de la reseña, 
 * req.body los nuevos datos (review_txt, rating, etc.) y 
 * req.user contenga el usuario autenticado.
 */
async function updateReview(req, res) {
  try {
    const reviewId = req.params.reviewId;
    // Se asume que el middleware de autenticación ya ha asignado a req.user
    const currentUser = req.user && (req.user.id || req.user._id);
    const updatedReview = await ReviewService.updateReview(reviewId, req.body, currentUser);
    
    // Invalidar caché de reviews
    await invalidateReviewsCache();
    
    res.status(200).json({
      message: 'Reseña actualizada correctamente.',
      review: updatedReview
    });
  } catch (error) {
    console.error('[updateReview] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Elimina una reseña.
 * Se espera que req.params.reviewId contenga el ID de la reseña 
 * y que req.user contenga el usuario autenticado.
 */
async function deleteReview(req, res) {
  try {
    const reviewId = req.params.reviewId;
    const currentUser = req.user && (req.user.id || req.user._id);
    await ReviewService.deleteReview(reviewId, currentUser);
    
    // Invalidar caché de reviews
    await invalidateReviewsCache();
    
    res.status(200).json({ message: 'Reseña eliminada correctamente.' });
  } catch (error) {
    console.error('[deleteReview] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Agrega un "me gusta" a la reseña.
 * Se espera que req.params.reviewId contenga el ID de la reseña
 * y req.user contenga el usuario autenticado, además de su nombre (opcional).
 */
async function likeReview(req, res) {
  try {
    const reviewId = req.params.reviewId;
    const currentUser = req.user && (req.user.id || req.user._id);
    const userName = await getDisplayName(req.user);
    const totalLikes = await ReviewService.likeReview(reviewId, currentUser, userName);
    
    // Invalidar caché de reviews (los likes afectan la respuesta)
    await invalidateReviewsCache();
    
    res.status(200).json({
      message: 'Me gusta agregado a la reseña.',
      totalLikes
    });
  } catch (error) {
    console.error('[likeReview] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Remueve el "me gusta" de la reseña.
 * Se espera que req.params.reviewId contenga el ID de la reseña
 * y que req.user contenga el usuario autenticado.
 */
async function unlikeReview(req, res) {
  try {
    const reviewId = req.params.reviewId;
    const currentUser = req.user && (req.user.id || req.user._id);
    const totalLikes = await ReviewService.unlikeReview(reviewId, currentUser);
    
    // Invalidar caché de reviews (los likes afectan la respuesta)
    await invalidateReviewsCache();
    
    res.status(200).json({
      message: 'Me gusta removido de la reseña.',
      totalLikes
    });
  } catch (error) {
    console.error('[unlikeReview] Error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { 
  createReview, 
  getReviews, 
  updateReview, 
  deleteReview, 
  likeReview, 
  unlikeReview 
};
