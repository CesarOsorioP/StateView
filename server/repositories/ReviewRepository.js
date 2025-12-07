// repositories/ReviewRepository.js
const Review = require('../models/Review');

class ReviewRepository {
  async findOne(query) {
    return await Review.findOne(query);
  }

  async findById(reviewId) {
    return await Review.findById(reviewId);
  }

  async create(review) {
    return await review.save();
  }

  async update(review) {
    return await review.save();
  }

  async delete(reviewId) {
    return await Review.deleteOne({ _id: reviewId });
  }

  async find(filter) {
    return await Review.find(filter)
      .populate('userId', 'nombre email')
      .populate('itemId', 'titulo tipo');
  }
}

module.exports = new ReviewRepository();
