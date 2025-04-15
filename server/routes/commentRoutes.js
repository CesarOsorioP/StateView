// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const { createComment, getComments } = require('../controllers/commentController');

// Endpoint para crear un nuevo comentario
router.post('/', createComment);

// Endpoint para obtener los comentarios de una reseña específica
// Ejemplo: GET /api/comments/60e... (donde el parámetro es el reviewId)
router.get('/:reviewId', getComments);

module.exports = router;
