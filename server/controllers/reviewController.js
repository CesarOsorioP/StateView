// controllers/reviewController.js
const Review = require('../models/Review');
const mongoose = require('mongoose'); // Asegúrate de importar mongoose

async function createReview(req, res) {
  try {
    const { userId, itemId, review_txt, rating, onModel } = req.body;
    if (!userId || !itemId || !review_txt || rating == null || !onModel) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    // Verificar si ya existe una reseña para el mismo contenido de este usuario
    const reviewExistente = await Review.findOne({ userId, itemId, onModel });
    if (reviewExistente) {
      return res.status(400).json({ 
        error: 'Ya has reseñado este contenido. Puedes editar o eliminar la reseña existente.' 
      });
    }

    const review = new Review({ userId, itemId, review_txt, rating, onModel });
    await review.save();
    res.status(201).json({ message: 'Reseña creada exitosamente.', review });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la reseña: ' + error.message });
  }
}

async function getReviews(req, res) {
  try {
    const filter = {};
    if (req.query.itemId) {
      // Aquí se usa "new" para crear la instancia de ObjectId
      filter.itemId = new mongoose.Types.ObjectId(req.query.itemId);
    }
    const reviews = await Review.find(filter)
      .populate('userId', 'nombre email')
      .populate('itemId', 'titulo tipo');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo las reseñas: ' + error.message });
  }
}

async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { review_txt, rating } = req.body;

    // Buscar la reseña a actualizar
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    // Verificar que el usuario autenticado sea el propietario de la reseña
    const currentUserId = req.user?.id || req.user?._id;
    if (review.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta reseña.' });
    }

    // Actualizar los campos deseados y la fecha (opcional)
    review.review_txt = review_txt;
    review.rating = rating;
    review.fechaReview = Date.now(); // opcional: para actualizar la fecha de modificación
    await review.save();

    res.json({ message: 'Reseña actualizada correctamente.', review });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la reseña: ' + error.message });
  }
}

async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    // Buscar la reseña a eliminar
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    // Verificar que el usuario autenticado sea el propietario de la reseña
    const currentUserId = req.user?.id || req.user?._id;
    if (review.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña.' });
    }

    await Review.deleteOne({ _id: reviewId });
    res.json({ message: 'Reseña eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la reseña: ' + error.message });
  }
}

// Nueva funcionalidad: Dar "me gusta" a una reseña
async function likeReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    // Se asume que el token contiene el nombre del usuario en req.user.nombre
    const userName = req.user.nombre || "Anónimo";

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Reseña no encontrada.' });
    }

    // Verificar si el usuario ya dio "me gusta" a esta reseña
    const alreadyLiked = review.likedReview.some(like => like.id_liked_review.equals(userId));
    if (alreadyLiked) {
      return res.status(400).json({ error: 'Ya has dado me gusta a esta reseña.' });
    }

    // Agregar el like al array likedReview
    review.likedReview.push({
      id_liked_review: userId,
      nombre_persona_review: userName,
      id_persona_review: userId
    });

    await review.save();
    res.json({ message: 'Me gusta agregado a la reseña.', totalLikes: review.likedReview.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al dar me gusta: ' + error.message });
  }
}

// Nueva funcionalidad: Remover "me gusta" de una reseña
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

    // Buscar el índice del like en el array
    const likeIndex = review.likedReview.findIndex(like => like.id_liked_review.equals(userId));
    if (likeIndex === -1) {
      return res.status(400).json({ error: 'No has dado me gusta a esta reseña.' });
    }

    // Remover el like
    review.likedReview.splice(likeIndex, 1);
    await review.save();

    res.json({ message: 'Me gusta removido de la reseña.', totalLikes: review.likedReview.length });
  } catch (error) {
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
