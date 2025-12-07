const Review = require('../models/Review');
const Comment = require('../models/Comment');

// Importar modelos de contenido
const Album = require('../models/Album');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Videojuego = require('../models/Videojuego');

class UserContentService {
  /**
   * Obtiene todas las reseñas de un usuario.
   * @param {String} userId - ID del usuario
   * @returns {Promise<Array>} Lista de reseñas del usuario
   */
  async getUserReviews(userId) {
    try {
      const reviews = await Review.find({ userId: userId })
        .populate('userId', 'username nombre imagenPerfil')
        .sort({ fechaReview: -1 });

      // Poblar manualmente el contenido según el modelo
      const populatedReviews = await Promise.all(reviews.map(async (review) => {
        let contenido = null;
        let contenido_id = null;
        let contenido_titulo = 'Contenido no disponible';
        let contenido_imagen = null;
        let tipo = review.onModel;
        try {
          if (review.itemId && tipo) {
            let model;
            if (tipo === 'Album') model = Album;
            else if (tipo === 'Pelicula') model = Pelicula;
            else if (tipo === 'Serie') model = Serie;
            else if (tipo === 'Videojuego') model = Videojuego;
            if (model) {
              contenido = await model.findById(review.itemId).select('titulo nombre portada imagen poster album_id pelicula_id serie_id juego_id');
              contenido_id = contenido?.album_id || contenido?.pelicula_id || contenido?.serie_id || contenido?.juego_id || contenido?._id || null;
              contenido_titulo = contenido?.titulo || contenido?.nombre || 'Contenido no disponible';
              contenido_imagen = contenido?.imagen || contenido?.portada || contenido?.poster || null;
            }
          }
        } catch (e) {
          // Si hay error, dejar valores por defecto
        }
        return {
          _id: review._id,
          titulo: review.titulo,
          contenido: review.review_txt,
          calificacion: review.rating,
          fecha: review.fechaReview,
          tipo: tipo,
          contenido_id,
          contenido_titulo,
          contenido_imagen,
          likes: review.likedReview?.length || 0
        };
      }));
      return populatedReviews;
    } catch (error) {
      console.error('[getUserReviews] Error:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los comentarios de un usuario.
   * @param {String} userId - ID del usuario
   * @returns {Promise<Array>} Lista de comentarios del usuario
   */
  async getUserComments(userId) {
    try {
      const comments = await Comment.find({ userId: userId })
        .populate('userId', 'username nombre imagenPerfil')
        .populate({
          path: 'reviewId',
          populate: {
            path: 'userId',
            select: 'username nombre imagenPerfil'
          }
        })
        .populate({
          path: 'reviewId',
          populate: {
            path: 'itemId',
            select: 'titulo nombre portada imagen poster album_id pelicula_id serie_id juego_id'
          }
        })
        .sort({ fechaCreacion: -1 });

      return comments.map(comment => {
        // Obtener el tipo de contenido
        const tipo = comment.reviewId?.onModel || 'Desconocido';
        // Obtener el objeto del contenido (Album, Serie, etc)
        const contenido = comment.reviewId?.itemId;
        // Determinar el identificador público correcto
        let contenido_id = null;
        if (contenido) {
          if (tipo === 'Album') contenido_id = contenido.album_id || contenido._id;
          else if (tipo === 'Serie') contenido_id = contenido.serie_id || contenido._id;
          else if (tipo === 'Videojuego') contenido_id = contenido.juego_id || contenido._id;
          else if (tipo === 'Pelicula') contenido_id = contenido.pelicula_id || contenido._id;
          else contenido_id = contenido._id;
        }
        return {
          _id: comment._id,
          contenido: comment.comment_txt,
          fecha: comment.fechaCreacion,
          tipo: tipo,
          contenido_id: contenido_id,
          contenido_titulo: contenido?.titulo || contenido?.nombre || 'Contenido no disponible',
          contenido_imagen: contenido?.imagen || contenido?.portada || contenido?.poster || null,
          reseña_id: comment.reviewId?._id || null,
          reseña_titulo: comment.reviewId?.titulo || 'Reseña no disponible',
          reseña_contenido: comment.reviewId?.review_txt || 'Contenido no disponible',
          autor_reseña: {
            id: comment.reviewId?.userId?._id || null,
            nombre: comment.reviewId?.userId?.nombre || 'Usuario desconocido',
            imagen: comment.reviewId?.userId?.imagenPerfil || null
          },
          likes: comment.liked_comment?.length || 0
        };
      });
    } catch (error) {
      console.error('[getUserComments] Error:', error);
      throw error;
    }
  }
}

module.exports = new UserContentService(); 