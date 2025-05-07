// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createComment,
  getComments,
  likeComment,
  unlikeComment,
  deleteComment,
  updateComment,
} = require('../controllers/commentController');

// Crear un comentario (requiere autenticación)
router.post('/', protect, createComment);

// Obtener comentarios filtrando por reviewId (p. ej., /api/comments?reviewId=...)
router.get('/', getComments);

router.put('/:commentId', protect, updateComment);
// Dar "me gusta" a un comentario (requiere autenticación)
router.post('/:commentId/like', protect, likeComment);


// Remover "me gusta" de un comentario (requiere autenticación)
router.delete('/:commentId/like', protect, unlikeComment);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
