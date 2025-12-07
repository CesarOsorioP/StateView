// services/ReviewService.js
const mongoose = require('mongoose');
const ReviewRepository = require('../repositories/ReviewRepository');
const ReviewFactory = require('../factories/ReviewFactory');
const Persona = require('../models/Persona');
const { crearNotificacion } = require('../controllers/notificacionController');

// Importamos los modelos de ítems y definimos un mapeo
const Serie = require('../models/Serie');
const Pelicula = require('../models/Pelicula');
const Videojuego = require('../models/Videojuego');
const Album = require('../models/Album');

const MODEL_MAP = {
  'Serie': Serie,
  'Pelicula': Pelicula,
  'Videojuego': Videojuego,
  'Album': Album
};

/**
 * Busca un ítem (Serie, Película, Videojuego o Álbum) por su ID.
 * Intenta primero con el _id de MongoDB; si falla, busca por un campo externo.
 */
async function findItemById(itemId, modelName) {
  const Model = MODEL_MAP[modelName];
  if (!Model) {
    throw new Error('Modelo no válido');
  }
  let item = null;
  // Intentar buscar por _id si es un ObjectId válido
  if (mongoose.Types.ObjectId.isValid(itemId)) {
    item = await Model.findById(itemId);
    if (item) return item;
  }
  // Si no se encontró, buscar por el campo externo
  const idField = {
    'Pelicula': 'pelicula_id',
    'Serie': 'serie_id',
    'Videojuego': 'juego_id',
    'Album': 'album_id'
  }[modelName];
  if (idField) {
    item = await Model.findOne({ [idField]: itemId });
  }
  if (!item) {
    throw new Error('Contenido no encontrado');
  }
  return item;
}

/**
 * Actualiza el rating de un ítem.
 * Si isDelete es true, se elimina la calificación; de lo contrario, se agrega.
 */
async function updateItemRating(itemId, modelName, rating, isRemoving = false) {
  const Model = MODEL_MAP[modelName];
  if (!Model) {
    throw new Error('Modelo no válido');
  }
  const item = await Model.findById(itemId);
  if (!item) {
    throw new Error('Contenido no encontrado');
  }

  if (isRemoving) {
    item.totalRating -= rating;
    item.ratingCount -= 1;
  } else {
    item.totalRating = (item.totalRating || 0) + rating;
    item.ratingCount = (item.ratingCount || 0) + 1;
  }
  item.averageRating = item.ratingCount > 0 ? item.totalRating / item.ratingCount : 0;
  await item.save();
  return item;
}

class ReviewService {
  /**
   * Crea una nueva reseña.
   * Verifica que no exista ya una reseña del usuario para el mismo ítem, crea la reseña y actualiza el rating del ítem.
   */
  async createReview(data) {
    // Validar campos requeridos
    if (!data.userId || !data.itemId || !data.review_txt || data.rating == null || !data.onModel) {
      throw new Error('Faltan campos requeridos.');
    }
    if (!MODEL_MAP[data.onModel]) {
      throw new Error('Modelo no válido.');
    }
    // Encontrar el ítem y obtener su _id de MongoDB
    const item = await findItemById(data.itemId, data.onModel);
    const mongoItemId = item._id;

    // Verificar si ya existe una reseña para este contenido
    const reviewExistente = await ReviewRepository.findOne({ 
      userId: data.userId, 
      itemId: mongoItemId, 
      onModel: data.onModel 
    });
    if (reviewExistente) {
      throw new Error('Ya has reseñado este contenido. Puedes editar o eliminar la reseña existente.');
    }

    // Crear la reseña usando el factory
    const review = ReviewFactory.create(data, mongoItemId);
    const savedReview = await ReviewRepository.create(review);

    // Obtener datos del usuario para denormalización
    const user = await Persona.findById(data.userId);

    // Denormalized review object
    const denormalizedReview = {
      reviewId: savedReview._id,
      userId: user._id,
      username: user.nombre,
      userAvatar: user.imagenPerfil,
      review_txt: data.review_txt,
      rating: parseFloat(data.rating),
      fechaReview: savedReview.fechaReview,
      likesCount: 0
    };

    // Actualizar el rating del ítem y agregar la reseña denormalizada
    const Model = MODEL_MAP[data.onModel];
    const updatedItem = await updateItemRating(mongoItemId, data.onModel, parseFloat(data.rating));
    
    // Push denormalized review to item
    await Model.findByIdAndUpdate(mongoItemId, {
      $push: { reviews: denormalizedReview }
    });

    // Añadir la reseña al perfil del usuario
    await Persona.findByIdAndUpdate(
      data.userId,
      {
        $push: {
          reviews: {
            reviewId: savedReview._id,
            contenido: data.review_txt,
            itemId: mongoItemId.toString(),
            itemType: data.onModel,
            rating: parseFloat(data.rating),
            estado: 'Activo'
          }
        }
      },
      { new: true }
    );

    return { review: savedReview, updatedItem };
  }

  /**
   * Obtiene reseñas. Si se proporciona itemId y onModel, se filtra por ese ítem.
   */
  async getReviews(query) {
    if (query.itemId && query.onModel) {
      const item = await findItemById(query.itemId, query.onModel);
      if (item && item.reviews && item.reviews.length > 0) {
        // Retornamos las reseñas denormalizadas ordenadas por fecha descendente
        return item.reviews.sort((a, b) => new Date(b.fechaReview) - new Date(a.fechaReview));
      }
      // Si no hay reseñas denormalizadas, buscar en la colección de reviews (fallback)
      const itemReviews = await ReviewRepository.find({ itemId: item._id });
      return itemReviews;
    }

    // Si no hay filtro específico de ítem, usamos comportamiento estándar (opcional)
    return await ReviewRepository.find({});
  }

  /**
   * Actualiza una reseña. Realiza primero la actualización del rating del ítem (quitando el rating viejo y sumando el nuevo) y luego actualiza la reseña.
   */
  async updateReview(reviewId, data, currentUser) {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Reseña no encontrada.');
    }
    if (review.userId.toString() !== currentUser.toString()) {
      throw new Error('No tienes permiso para editar esta reseña.');
    }
    // Actualizar el rating del ítem: quitar el rating anterior y agregar el nuevo
    await updateItemRating(review.itemId, review.onModel, review.rating, true);
    await updateItemRating(review.itemId, review.onModel, parseFloat(data.rating));

    // Actualizar la reseña con los nuevos valores
    const oldRating = review.rating;
    review.review_txt = data.review_txt;
    review.rating = parseFloat(data.rating);
    review.fechaReview = Date.now();
    await ReviewRepository.update(review);

    // Actualizar la reseña denormalizada en el ítem
    const Model = MODEL_MAP[review.onModel];
    await Model.updateOne(
      { _id: review.itemId, "reviews.reviewId": reviewId },
      {
        $set: {
          "reviews.$.review_txt": data.review_txt,
          "reviews.$.rating": parseFloat(data.rating),
          "reviews.$.fechaReview": review.fechaReview
        }
      }
    );

    // Actualizar la reseña en el perfil del usuario
    await Persona.updateOne(
      { _id: currentUser, 'reviews.reviewId': reviewId },
      {
        $set: {
          'reviews.$.contenido': data.review_txt,
          'reviews.$.rating': parseFloat(data.rating),
          'reviews.$.fecha': Date.now()
        }
      }
    );

    return review;
  }

  /**
   * Elimina una reseña y actualiza el rating del ítem.
   */
  async deleteReview(reviewId, currentUser) {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Reseña no encontrada.');
    }
    if (review.userId.toString() !== currentUser.toString()) {
      throw new Error('No tienes permiso para eliminar esta reseña.');
    }
    await updateItemRating(review.itemId, review.onModel, review.rating, true);
    await ReviewRepository.delete(reviewId);

    // Eliminar la reseña denormalizada del ítem
    const Model = MODEL_MAP[review.onModel];
    await Model.findByIdAndUpdate(review.itemId, {
      $pull: { reviews: { reviewId: reviewId } }
    });
    
    // Eliminar la reseña del perfil del usuario
    await Persona.findByIdAndUpdate(
      currentUser,
      { $pull: { reviews: { reviewId: reviewId } } }
    );
    
    return true;
  }

  /**
   * Agrega un "me gusta" a la reseña.
   */
  async likeReview(reviewId, currentUser, userName) {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Reseña no encontrada.');
    }
    const alreadyLiked = review.likedReview.some(like => like.id_liked_review.equals(currentUser));
    if (alreadyLiked) {
      throw new Error('Ya has dado me gusta a esta reseña.');
    }
    review.likedReview.push({
      id_liked_review: currentUser,
      nombre_persona_review: userName || "Anónimo",
      id_persona_review: currentUser
    });
    await ReviewRepository.update(review);

    // Actualizar likesCount en el ítem
    const Model = MODEL_MAP[review.onModel];
    await Model.updateOne(
      { _id: review.itemId, "reviews.reviewId": reviewId },
      { $inc: { "reviews.$.likesCount": 1 } }
    );

    // Crear notificación de like
    if (review.userId.toString() !== currentUser.toString()) {
      try {
        // Intentar obtener el título del contenido para la notificación
        let contentTitle = 'un contenido';
        try {
          const item = await findItemById(review.itemId, review.onModel);
          if (item) {
            contentTitle = item.titulo || item.nombre || item.title || 'un contenido';
          }
        } catch (e) {
          // Si falla al obtener el ítem, usamos el fallback
          console.log('No se pudo obtener el ítem para el título de la notificación:', e.message);
        }

        await crearNotificacion(
          review.userId,
          'like_review',
          `${userName || "Un usuario"} indicó que le gusta tu reseña de ${contentTitle}.`,
          { tipo: 'reseña', id: reviewId },
          currentUser
        );
      } catch (error) {
        console.error('Error creando notificación de like review:', error);
      }
    }

    return review.likedReview.length;
  }

  /**
   * Remueve el "me gusta" de la reseña.
   */
  async unlikeReview(reviewId, currentUser) {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Reseña no encontrada.');
    }
    const likeIndex = review.likedReview.findIndex(like => like.id_liked_review.equals(currentUser));
    if (likeIndex === -1) {
      throw new Error('No has dado me gusta a esta reseña.');
    }
    review.likedReview.splice(likeIndex, 1);
    await ReviewRepository.update(review);

    // Actualizar likesCount en el ítem
    const Model = MODEL_MAP[review.onModel];
    await Model.updateOne(
      { _id: review.itemId, "reviews.reviewId": reviewId },
      { $inc: { "reviews.$.likesCount": -1 } }
    );

    return review.likedReview.length;
  }
}

module.exports = new ReviewService();