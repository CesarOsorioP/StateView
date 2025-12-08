// controllers/CommentController.js
const CommentService = require('../services/commentService');
const { crearNotificacion } = require('./notificacionController'); // Importar la función de creación de notificaciones
const Review = require('../models/Review'); // Importar el modelo Review
const Persona = require('../models/Persona'); // Importar el modelo Persona

async function getDisplayName(user) {
  if (!user) return 'Usuario';
  const direct = user.username || user.nombre;
  if (direct) return direct;
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

async function createComment(req, res) {
  try {
    // Obtener el ID del usuario autenticado
    const userId = req.user?.id || req.user?._id;
    const data = {
      reviewId: req.body.reviewId,
      comment_txt: req.body.comment_txt,
      userId
    };
    const comment = await CommentService.createComment(data);

    // Lógica para crear la notificación
    if (comment) {
      try {
        const review = await Review.findById(req.body.reviewId)
          .populate('userId')
          .populate('itemId'); // Populate dinámico para obtener el título del contenido
          
        if (review && review.userId && review.userId._id.toString() !== userId.toString()) {
          const commentAuthor = await Persona.findById(userId);
          // Obtener título del contenido de forma segura
          // itemId ahora debería ser el documento poblado (Pelicula, Serie, etc.)
          const contentTitle = review.itemId ? (review.itemId.titulo || review.itemId.nombre || 'un contenido') : 'una publicación';
          
          const contenidoNotificacion = `${commentAuthor.username || commentAuthor.nombre} ha comentado tu reseña de ${contentTitle}.`;
          await crearNotificacion(
            review.userId._id, // El usuario que recibe la notificación (autor de la reseña)
            'comentario', // Tipo de notificación
            contenidoNotificacion, // Contenido de la notificación
            { tipo: 'reseña', id: review._id }, // Referencia a la reseña comentada
            userId // Emisor de la notificación (el que comentó)
          );
        }
      } catch (notifError) {
        console.error('Error al crear notificación de comentario:', notifError);
        // No fallar la request principal si falla la notificación
      }
    }

    res.status(201).json({ message: 'Comentario creado exitosamente.', comment });
  } catch (error) {
    console.error('Error al crear el comentario: ' + error.message);
    res.status(500).json({ error: 'Error al crear el comentario: ' + error.message });
  }
}

async function updateComment(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?.id || req.user?._id;
    const updatedComment = await CommentService.updateComment(commentId, req.body, userId);
    res.json({ message: 'Comentario actualizado exitosamente.', comment: updatedComment });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el comentario: ' + error.message });
  }
}

async function getComments(req, res) {
  try {
    const reviewId = req.query.reviewId;
    const comments = await CommentService.getComments(reviewId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los comentarios: ' + error.message });
  }
}

async function deleteComment(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?.id || req.user?._id;
    const deletedCommentId = await CommentService.deleteComment(commentId, userId);
    res.json({ message: 'Comentario eliminado exitosamente.', commentId: deletedCommentId });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el comentario: ' + error.message });
  }
}

async function likeComment(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?.id || req.user?._id;
    const userName = await getDisplayName(req.user);
    const totalLikes = await CommentService.likeComment(commentId, userId, userName);
    res.json({ message: 'Me gusta agregado.', totalLikes });
  } catch (error) {
    res.status(500).json({ error: 'Error al dar me gusta: ' + error.message });
  }
}

async function unlikeComment(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user?.id || req.user?._id;
    const totalLikes = await CommentService.unlikeComment(commentId, userId);
    res.json({ message: 'Me gusta removido.', totalLikes });
  } catch (error) {
    res.status(500).json({ error: 'Error al remover me gusta: ' + error.message });
  }
}

module.exports = {
  createComment,
  updateComment,
  getComments,
  deleteComment,
  likeComment,
  unlikeComment
};
