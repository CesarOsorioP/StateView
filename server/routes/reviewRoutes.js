// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { createReview, getReviews } = require('../controllers/reviewController');

// Endpoint para crear una nueva reseña
router.post('/', createReview);

// Endpoint para obtener todas las reseñas o filtradas por itemId (usando ?itemId=...)
router.get('/', getReviews);

module.exports = router;
