// controllers/reviewController.js
const Review = require('../models/Review');
const mongoose = require('mongoose');
const Serie = require('../models/Serie');
const Pelicula = require('../models/Pelicula');
const Videojuego = require('../models/Videojuego');
const Album = require('../models/Album');

// Mapeo de modelos para búsqueda eficiente
const MODEL_MAP = {
  'Serie': Serie,
  'Pelicula': Pelicula,
  'Videojuego': Videojuego,
  'Album': Album
};

// Función auxiliar para encontrar un ítem por su ID
async function findItemById(itemId, onModel) {
  const Model = MODEL_MAP[onModel];
  if (!Model) {
    throw new Error('Modelo no válido');
  }

  let item;
  try {
    // Intentar buscar por _id primero
    try {
      const objectId = new mongoose.Types.ObjectId(itemId);
      item = await Model.findById(objectId);
    } catch (error) {
      // Si falla la conversión a ObjectId, continuar con la búsqueda por ID externo
    }

    // Si no se encontró por _id, intentar buscar por ID externo
    if (!item) {
      const idField = {
        'Pelicula': 'pelicula_id',
        'Serie': 'serie_id',
        'Videojuego': 'videojuego_id',
        'Album': 'album_id'
      }[onModel];

      if (idField) {
        item = await Model.findOne({ [idField]: itemId });
      }
    }

    if (!item) {
      throw new Error('Ítem no encontrado');
    }

    return item;
  } catch (error) {
    console.error(`[findItemById] Error al buscar ${onModel}:`, error);
    throw error;
  }
}

// Función auxiliar para actualizar el rating de un ítem
async function updateItemRating(itemId, onModel, rating, isDelete = false) {
  try {
    const item = await findItemById(itemId, onModel);
    console.log(`[updateItemRating] ${onModel} encontrado:`, item);

    // Actualizar ratings
    if (isDelete) {
      item.totalRating -= rating;
      item.ratingCount -= 1;
    } else {
      item.totalRating += rating;
      item.ratingCount += 1;
    }

    // Calcular nuevo promedio
    item.averageRating = item.ratingCount > 0 ? item.totalRating / item.ratingCount : 0;

    console.log(`[updateItemRating] ${onModel} actualizado:`, {
      totalRating: item.totalRating,
      ratingCount: item.ratingCount,
      averageRating: item.averageRating
    });

    await item.save();
    return item;
  } catch (error) {
    console.error(`[updateItemRating] Error al actualizar ${onModel}:`, error);
    throw error;
  }
}

async function createReview(req, res) {
  try {
    const { userId, itemId, review_txt, rating, onModel } = req.body;
    console.log('[createReview] Body recibido:', req.body);

    // Validar campos requeridos
    if (!userId || !itemId || !review_txt || rating == null || !onModel) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Validar modelo
    if (!MODEL_MAP[onModel]) {
      return res.status(400).json({ error: 'Modelo no válido.' });
    }

    // Encontrar el ítem y obtener su ID de MongoDB
    const item = await findItemById(itemId, onModel);
    const mongoItemId = item._id;

    // Verificar reseña existente
    const reviewExistente = await Review.findOne({ 
      userId, 
      itemId: mongoItemId, 
      onModel 
    });

    if (reviewExistente) {
      return res.status(400).json({ 
        error: 'Ya has reseñado este contenido. Puedes editar o eliminar la reseña existente.' 
      });
    }

    // Crear la reseña con valores explícitos para todos los campos requeridos
    const reviewData = {
      userId,
      autor: userId,  // Asegúrate de que este campo esté presente
      itemId: mongoItemId,
      review_txt,
      contenido: review_txt,  // Asegúrate de que este campo esté presente
      rating: parseFloat(rating),
      calificacion: parseFloat(rating),  // Asegúrate de que este campo esté presente
      onModel,
      estado: req.body.estado || 'Activo'
    };

    // Crear y guardar la reseña
    const review = new Review(reviewData);
    await review.save();
    console.log('[createReview] Reseña guardada:', review);

    // Actualizar rating del ítem
    const updatedItem = await updateItemRating(mongoItemId, onModel, parseFloat(rating));
    console.log('[createReview] Ítem actualizado:', updatedItem);

    res.status(201).json({ 
      message: 'Reseña creada exitosamente.', 
      review,
      updatedItem
    });
  } catch (error) {
    console.error('[createReview] Error:', error);
    res.status(500).json({ error: 'Error al crear la reseña: ' + error.message });
  }
}

async function getReviews(req, res) {
  try {
    const filter = {};
    if (req.query.itemId && req.query.onModel) {
      const item = await findItemById(req.query.itemId, req.query.onModel);
      if (item) {
        filter.itemId = item._id;
      }
    }

    const reviews = await Review.find(filter)
      .populate('userId', 'nombre email')
      .populate('itemId', 'titulo tipo');
    res.json(reviews);
  } catch (error) {
    console.error('[getReviews] Error:', error);
    res.status(500).json({ error: 'Error obteniendo las reseñas: ' + error.message });
  }
}

async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { review_txt, rating } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    // Verificar permisos
    const currentUserId = req.user?.id || req.user?._id;
    if (review.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta reseña.' });
    }

    // Actualizar ratings
    await updateItemRating(review.itemId, review.onModel, review.rating, true);
    await updateItemRating(review.itemId, review.onModel, rating);

    // Actualizar reseña con valores explícitos para todos los campos
    review.review_txt = review_txt;
    review.contenido = review_txt;  // Actualizar también el campo alias
    review.rating = parseFloat(rating);
    review.calificacion = parseFloat(rating);  // Actualizar también el campo alias
    review.fechaReview = Date.now();
    await review.save();

    res.json({ message: 'Reseña actualizada correctamente.', review });
  } catch (error) {
    console.error('[updateReview] Error:', error);
    res.status(500).json({ error: 'Error al actualizar la reseña: ' + error.message });
  }
}

async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    // Verificar permisos
    const currentUserId = req.user?.id || req.user?._id;
    if (review.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña.' });
    }

    // Actualizar rating del ítem
    await updateItemRating(review.itemId, review.onModel, review.rating, true);

    // Eliminar reseña
    await Review.deleteOne({ _id: reviewId });
    res.json({ message: 'Reseña eliminada correctamente.' });
  } catch (error) {
    console.error('[deleteReview] Error:', error);
    res.status(500).json({ error: 'Error al eliminar la reseña: ' + error.message });
  }
}

async function likeReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const userName = req.user.nombre || "Anónimo";
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    const alreadyLiked = review.likedReview.some(like => like.id_liked_review.equals(userId));
    if (alreadyLiked) {
      return res.status(400).json({ error: 'Ya has dado me gusta a esta reseña.' });
    }

    review.likedReview.push({
      id_liked_review: userId,
      nombre_persona_review: userName,
      id_persona_review: userId
    });

    await review.save();
    res.json({ message: 'Me gusta agregado a la reseña.', totalLikes: review.likedReview.length });
  } catch (error) {
    console.error('[likeReview] Error:', error);
    res.status(500).json({ error: 'Error al dar me gusta: ' + error.message });
  }
}

async function unlikeReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    const likeIndex = review.likedReview.findIndex(like => like.id_liked_review.equals(userId));
    if (likeIndex === -1) {
      return res.status(400).json({ error: 'No has dado me gusta a esta reseña.' });
    }

    review.likedReview.splice(likeIndex, 1);
    await review.save();

    res.json({ message: 'Me gusta removido de la reseña.', totalLikes: review.likedReview.length });
  } catch (error) {
    console.error('[unlikeReview] Error:', error);
    res.status(500).json({ error: 'Error al remover me gusta: ' + error.message });
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