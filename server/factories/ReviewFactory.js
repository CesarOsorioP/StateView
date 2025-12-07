// factories/ReviewFactory.js
const Review = require('../models/Review');

class ReviewFactory {

  static create(data, mongoItemId) {
    const reviewData = {
      userId: data.userId,
      itemId: mongoItemId,
      review_txt: data.review_txt,
      rating: parseFloat(data.rating),
      onModel: data.onModel,
      estado: data.estado || 'Activo'
    };
    return new Review(reviewData);
  }
}

module.exports = ReviewFactory;