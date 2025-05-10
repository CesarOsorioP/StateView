// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const { getItemRating } = require('../controllers/itemController');

// Ejemplo: GET /api/item/<itemId>/rating
router.get('/:itemId/rating', getItemRating);

module.exports = router;
