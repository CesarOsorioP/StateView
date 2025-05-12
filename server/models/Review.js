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
  autor: { type: Schema.Types.ObjectId, ref: 'Persona', required: true }, // Alias para mantener compatibilidad
  // Usamos refPath para referenciar dinámicamente según el valor en onModel
  itemId: { type: Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  // Campo que indicará a qué modelo pertenece el ítem (Película, Serie, Videojuego o Album)
  onModel: { 
    type: String,
    required: true,
    enum: ['Pelicula', 'Serie', 'Videojuego', 'Album']
  },
  review_txt: { type: String, required: true },
  contenido: { type: String, required: true }, // Alias para mantener compatibilidad
  fechaReview: { type: Date, default: Date.now },
  rating: { type: Number, required: true, min: 0, max: 5 },
  calificacion: { type: Number, required: true, min: 0, max: 5 }, // Alias para mantener compatibilidad
  likedReview: [reviewLikeSchema],
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

// Middleware pre-save para sincronizar campos
reviewSchema.pre('save', function(next) {
  // Sincronizamos los campos aliases con los originales
  if (this.userId && !this.autor) this.autor = this.userId;
  if (this.autor && !this.userId) this.userId = this.autor;
  
  if (this.review_txt && !this.contenido) this.contenido = this.review_txt;
  if (this.contenido && !this.review_txt) this.review_txt = this.contenido;
  
  if (this.rating && !this.calificacion) this.calificacion = this.rating;
  if (this.calificacion && !this.rating) this.rating = this.calificacion;
  
  next();
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

// Se eliminó el virtual para createdAt para evitar conflictos con timestamps
// reviewSchema.virtual('createdAt').get(function() {
//   return this.fechaReview || new Date();
// });

module.exports = mongoose.model('Review', reviewSchema);
