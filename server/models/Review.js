// models/Review.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subesquema para los "likes" de la review
const reviewLikeSchema = new Schema({
  id_liked_review: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
  nombre_persona_review: { type: String, required: true },
  id_persona_review: { type: Schema.Types.ObjectId, ref: 'Persona', required: true }
}, { _id: false });

// Esquema principal para Review con referencia dinámica
const reviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
  // Usamos refPath para referenciar dinámicamente según el valor en onModel
  itemId: { type: Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  // Campo que indicará a qué modelo pertenece el ítem (Película, Serie, Videojuego o Album)
  onModel: { 
    type: String,
    required: true,
    enum: ['Pelicula', 'Serie', 'Videojuego', 'Album']
  },
  review_txt: { type: String, required: true },
  fechaReview: { type: Date, default: Date.now },
  rating: { type: Number, required: true },
  likedReview: [reviewLikeSchema]
});

module.exports = mongoose.model('Review', reviewSchema);
