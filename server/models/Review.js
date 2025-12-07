
// models/Review.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subesquema para los "likes" de la review
const reviewLikeSchema = new Schema({
  id_liked_review: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
  nombre_persona_review: { type: String, required: true },
  id_persona_review: { type: Schema.Types.ObjectId, ref: 'Persona', required: true }
}, { _id: false });

const commentDenormalizedSchema = new Schema({
  commentId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  username: { type: String },
  userAvatar: { type: String },
  comment_txt: { type: String },
  fechaCreacion: { type: Date },
  likesCount: { type: Number, default: 0 }
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
  // Mantenemos solo uno de los campos como el real en la base de datos
  review_txt: { type: String, required: true },
  fechaReview: { type: Date, default: Date.now },
  // Mantenemos solo uno de los campos como el real en la base de datos
  rating: { type: Number, required: true, min: 0, max: 5 },
  likedReview: [reviewLikeSchema],
  comments: [commentDenormalizedSchema], // Denormalized comments
  estado: {
    type: String,
    enum: ['Activo', 'Pendiente', 'Bloqueado', 'Eliminado'],
    default: 'Activo'
  }
}, { 
  timestamps: true, // Añadimos timestamps para createdAt y updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals para mantener la compatibilidad sin duplicar datos
reviewSchema.virtual('autor').get(function() {
  return this.userId;
}).set(function(v) {
  this.userId = v;
});

// Virtual para 'contenido' que mapea a review_txt
reviewSchema.virtual('contenido').get(function() {
  return this.review_txt;
}).set(function(v) {
  this.review_txt = v;
});

// Virtual para 'calificacion' que mapea a rating
reviewSchema.virtual('calificacion').get(function() {
  return this.rating;
}).set(function(v) {
  this.rating = v;
});

// Alias adicionales para obtener campos con diferentes nombres
reviewSchema.virtual('titulo').get(function() {
  // Si no hay título específico, devolvemos las primeras palabras del contenido
  return this.review_txt ? this.review_txt.substring(0, 30) + '...' : 'Sin título';
});

// Virtual para contar likes
reviewSchema.virtual('likes').get(function() {
  return this.likedReview ? this.likedReview.length : 0;
});

module.exports = mongoose.model('Review', reviewSchema);