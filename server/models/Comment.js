// models/Comment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subesquema para los "likes" del comentario
const commentLikeSchema = new Schema({
  id_liked_comment: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
  nombre_persona_comment: { type: String, required: true },
  id_persona_comment: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
}, { _id: false });

// Esquema principal para Comment
const commentSchema = new Schema({
  reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true }, // Reseña a la que responde el comentario
  userId: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },   // Usuario que comenta
  comment_txt: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
  liked_comment: [commentLikeSchema] // Array para los likes en el comentario
});

module.exports = mongoose.model('Comment', commentSchema);
