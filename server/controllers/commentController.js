// controllers/commentController.js
const Comment = require('../models/Comment');

// POST /api/comments
async function createComment(req, res) {
  try {
    const { reviewId, userId, comment_txt } = req.body;
    if (!reviewId || !userId || !comment_txt) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    const comment = new Comment({ reviewId, userId, comment_txt });
    await comment.save();
    res.status(201).json({ message: 'Comentario creado exitosamente.', comment });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el comentario: ' + error.message });
  }
}

// GET /api/comments/:reviewId
async function getComments(req, res) {
  try {
    const { reviewId } = req.params;
    const comments = await Comment.find({ reviewId })
      .populate('userId', 'nombre email');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo los comentarios: ' + error.message });
  }
}

module.exports = { createComment, getComments };
