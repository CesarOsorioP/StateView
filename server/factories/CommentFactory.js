// factories/CommentFactory.js
const Comment = require('../models/Comment');

class CommentFactory {
  /**
   * Crea una instancia de Comment a partir de los datos recibidos.
   * @param {Object} data - Objeto con reviewId, userId y comment_txt.
   * @returns {Comment} Instancia de Comment lista para ser guardada.
   */
  static create(data) {
    const commentData = {
      reviewId: data.reviewId,
      userId: data.userId,
      comment_txt: data.comment_txt,
      // Por defecto, el comentario no ha sido editado.
      isEdited: false,
      editDate: null,
      liked_comment: [] // Inicialmente, sin “me gusta”
    };
    return new Comment(commentData);
  }
}

module.exports = CommentFactory;
