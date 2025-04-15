// controllers/reviewController.js
const Review = require('../models/Review');
const mongoose = require('mongoose'); // Asegúrate de importar mongoose

async function createReview(req, res) {
  try {
    const { userId, itemId, review_txt, rating, onModel } = req.body;
    if (!userId || !itemId || !review_txt || rating == null || !onModel) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
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

module.exports = { createReview, getReviews };
