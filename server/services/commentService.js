// services/CommentService.js
const CommentRepository = require('../repositories/CommentRepository');
const CommentFactory = require('../factories/CommentFactory');
const Persona = require('../models/Persona');
const Review = require('../models/Review');
const { crearNotificacion } = require('../controllers/notificacionController');

class CommentService {
  /**
   * Crea un comentario para una reseña.
   * Verifica que se hayan enviado todos los campos requeridos y que el usuario no haya comentado ya en la misma reseña.
   * @param {Object} data - Datos que incluyen reviewId, comment_txt y userId.
   * @returns {Comment} El comentario creado y poblado con datos del usuario.
   */
  async createComment(data) {
    // Verificar campos requeridos.
    if (!data.userId || !data.reviewId || !data.comment_txt) {
      throw new Error('Faltan campos requeridos: reviewId y/o comment_txt.');
    }
    // Comprobar si el usuario ya dejó un comentario en esta reseña.
    const existingComment = await CommentRepository.findOne({
      reviewId: data.reviewId,
      userId: data.userId
    });
    if (existingComment) {
      throw new Error('Ya has dejado un comentario en esta reseña.');
    }
    // Crear el comentario mediante la factory.
    const comment = CommentFactory.create(data);
    const createdComment = await CommentRepository.create(comment);

    // Obtener datos del usuario para denormalización
    const user = await Persona.findById(data.userId);

    // Denormalized comment object
    const denormalizedComment = {
      commentId: createdComment._id,
      userId: user._id,
      username: user.nombre,
      userAvatar: user.imagenPerfil,
      comment_txt: data.comment_txt,
      fechaCreacion: createdComment.fechaCreacion,
      likesCount: 0
    };

    // Push denormalized comment to Review
    await Review.findByIdAndUpdate(data.reviewId, {
      $push: { comments: denormalizedComment }
    });
    
    // Añadir el comentario al perfil del usuario
    await Persona.findByIdAndUpdate(
      data.userId,
      {
        $push: {
          comments: {
            commentId: createdComment._id,
            contenido: data.comment_txt,
            reviewId: data.reviewId,
            estado: 'Activo'
          }
        }
      },
      { new: true }
    );
    
    // Populamos la información del usuario.
    await createdComment.populate('userId', 'nombre email username');
    return createdComment;
  }

  /**
   * Actualiza un comentario existente.
   * @param {String} commentId - ID del comentario a actualizar.
   * @param {Object} data - Objeto que contiene el nuevo texto.
   * @param {String} currentUser - El ID del usuario autenticado.
   * @returns {Comment} El comentario actualizado y poblado.
   */
  async updateComment(commentId, data, currentUser) {
    if (!data.comment_txt || data.comment_txt.trim() === '') {
      throw new Error('El texto del comentario no puede estar vacío.');
    }
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error('Comentario no encontrado.');
    }
    if (comment.userId.toString() !== currentUser.toString()) {
      throw new Error('No tienes permiso para editar este comentario.');
    }
    comment.comment_txt = data.comment_txt;
    comment.isEdited = true;
    comment.editDate = Date.now();
    const updatedComment = await CommentRepository.update(comment);

    // Actualizar el comentario denormalizado en la Reseña
    await Review.updateOne(
      { _id: comment.reviewId, "comments.commentId": commentId },
      {
        $set: {
          "comments.$.comment_txt": data.comment_txt
        }
      }
    );
    
    // Actualizar el comentario en el perfil del usuario
    await Persona.updateOne(
      { _id: currentUser, 'comments.commentId': commentId },
      {
        $set: {
          'comments.$.contenido': data.comment_txt,
          'comments.$.fecha': Date.now()
        }
      }
    );
    
    await updatedComment.populate('userId', 'nombre email username');
    return updatedComment;
  }

  /**
   * Obtiene comentarios filtrados por reviewId.
   * @param {String} reviewId - ID de la reseña.
   * @returns {Array<Comment>} Arreglo de comentarios.
   */
  async getComments(reviewId) {
    if (!reviewId || reviewId === 'undefined') {
      throw new Error('El parámetro reviewId es obligatorio y debe ser válido.');
    }
    
    // Primero intentar buscar en la colección de reviews (denormalización)
    try {
        const review = await Review.findById(reviewId);
        if (review && review.comments && review.comments.length > 0) {
          return review.comments.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        }
    } catch(err) {
        console.log("Error al buscar review para comentarios:", err.message);
    }

    // Si no hay en la denormalización o falla, buscar en la colección de comentarios
    return await CommentRepository.find({ reviewId });
  }

  /**
   * Elimina un comentario.
   * @param {String} commentId - ID del comentario a eliminar.
   * @param {String} currentUser - ID del usuario actual.
   * @returns {String} El ID del comentario eliminado.
   */
  async deleteComment(commentId, currentUser) {
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error('Comentario no encontrado.');
    }
    if (comment.userId.toString() !== currentUser.toString()) {
      throw new Error('No tienes permiso para eliminar este comentario.');
    }
    await CommentRepository.delete(commentId);

    // Eliminar el comentario denormalizado de la Reseña
    await Review.findByIdAndUpdate(comment.reviewId, {
      $pull: { comments: { commentId: commentId } }
    });
    
    // Eliminar el comentario del perfil del usuario
    await Persona.findByIdAndUpdate(
      currentUser,
      { $pull: { comments: { commentId: commentId } } }
    );
    
    return commentId;
  }

  /**
   * Agrega un "me gusta" a un comentario.
   * @param {String} commentId - ID del comentario.
   * @param {String} currentUser - ID del usuario que da like.
   * @param {String} userName - Nombre del usuario (opcional).
   * @returns {Number} El total de "me gusta" en el comentario.
   */
  async likeComment(commentId, currentUser, userName) {
    if (!currentUser) {
      throw new Error('Usuario no autenticado.');
    }
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error('Comentario no encontrado.');
    }
    const alreadyLiked = comment.liked_comment.some(like =>
      like.id_liked_comment.equals(currentUser)
    );
    if (alreadyLiked) {
      throw new Error('Ya has dado me gusta a este comentario.');
    }
    comment.liked_comment.push({
      id_liked_comment: currentUser,
      nombre_persona_comment: userName || 'Anónimo',
      id_persona_comment: currentUser
    });
    const updatedComment = await CommentRepository.update(comment);

    // Actualizar likesCount en la Reseña
    await Review.updateOne(
      { _id: comment.reviewId, "comments.commentId": commentId },
      { $inc: { "comments.$.likesCount": 1 } }
    );

    // Crear notificación de like comment
    if (comment.userId.toString() !== currentUser.toString()) {
      try {
        await crearNotificacion(
          comment.userId,
          'like_comment',
          `${userName || 'Un usuario'} indicó que le gusta tu comentario.`,
          { tipo: 'comentario', id: commentId },
          currentUser
        );
      } catch (error) {
        console.error('Error creando notificación de like comment:', error);
      }
    }

    return updatedComment.liked_comment.length;
  }

  /**
   * Remueve el "me gusta" de un comentario.
   * @param {String} commentId - ID del comentario.
   * @param {String} currentUser - ID del usuario.
   * @returns {Number} El total de "me gusta" actuales.
   */
  async unlikeComment(commentId, currentUser) {
    if (!currentUser) {
      throw new Error('Usuario no autenticado.');
    }
    const comment = await CommentRepository.findById(commentId);
    if (!comment) {
      throw new Error('Comentario no encontrado.');
    }
    const likeIndex = comment.liked_comment.findIndex(like =>
      like.id_liked_comment.equals(currentUser)
    );
    if (likeIndex === -1) {
      throw new Error('No has dado me gusta a este comentario.');
    }
    comment.liked_comment.splice(likeIndex, 1);
    const updatedComment = await CommentRepository.update(comment);

    // Actualizar likesCount en la Reseña
    await Review.updateOne(
      { _id: comment.reviewId, "comments.commentId": commentId },
      { $inc: { "comments.$.likesCount": -1 } }
    );

    return updatedComment.liked_comment.length;
  }
}

module.exports = new CommentService();
