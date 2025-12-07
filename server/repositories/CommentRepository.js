// repositories/CommentRepository.js
const Comment = require('../models/Comment');

class CommentRepository {
  async findOne(query) {
    return await Comment.findOne(query);
  }

  async findById(commentId) {
    return await Comment.findById(commentId);
  }

  async create(comment) {
    return await comment.save();
  }

  async update(comment) {
    return await comment.save();
  }

  async delete(commentId) {
    return await Comment.findByIdAndDelete(commentId);
  }

  async find(filter) {
    return await Comment.find(filter)
      .populate('userId', 'nombre email username');
  }
}

module.exports = new CommentRepository();
