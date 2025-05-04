// models/Comment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-esquema para los "me gusta" en comentarios
const likedCommentSchema = new Schema({
  id_liked_comment: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  nombre_persona_comment: { 
    type: String 
  },
  id_persona_comment: { 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Esquema de comentarios
const commentSchema = new Schema({
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment_txt: {
    type: String,
    required: true
  },
  commentDate: {
    type: Date,
    default: Date.now
  },
  // Campo para indicar si el comentario ha sido editado
  isEdited: {
    type: Boolean,
    default: false
  },
  // Fecha de edición del comentario
  editDate: {
    type: Date
  },
  // Lista de "me gusta" en el comentario
  liked_comment: [likedCommentSchema]
});

// Índice compuesto para asegurar que un usuario solo pueda comentar una vez por reseña
commentSchema.index({ reviewId: 1, userId: 1 }, { unique: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;