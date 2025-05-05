const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
  createReview, 
  getReviews, 
  updateReview, 
  deleteReview, 
  likeReview, 
  unlikeReview 
} = require('../controllers/reviewController');

// Crear una reseña (requiere autenticación)
router.post('/', protect, createReview);
// Obtener reseñas (público)
router.get('/', getReviews);
// Actualizar una reseña (requiere autenticación)
router.put('/:reviewId', protect, updateReview);
// Eliminar una reseña (requiere autenticación)
router.delete('/:reviewId', protect, deleteReview);

// Dar "me gusta" a una reseña (requiere autenticación)
router.post('/:reviewId/like', protect, likeReview);
// Remover "me gusta" de una reseña (requiere autenticación)
router.delete('/:reviewId/like', protect, unlikeReview);

module.exports = router;
