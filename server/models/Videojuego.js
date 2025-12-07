// models/Videojuego.js
const mongoose = require('mongoose');

const reviewDenormalizedSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String },
  userAvatar: { type: String },
  review_txt: { type: String },
  rating: { type: Number },
  fechaReview: { type: Date },
  likesCount: { type: Number, default: 0 }
}, { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

reviewDenormalizedSchema.virtual('likes').get(function() {
  return this.likesCount;
});

const videojuegoSchema = new mongoose.Schema({
  juego_id: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  desarrolladora: { type: String },
  publicadora: { type: String },
  plataformas: { type: String },
  genero: { type: String },
  fecha_lanzamiento: { type: String },
  sinopsis: { type: String },
  imagen: { type: String }, // Campo para almacenar el enlace de la imagen
  reviews: [reviewDenormalizedSchema], // Denormalized reviews
  totalRating: { type: Number, default: 0 },    // Suma total de ratings
  ratingCount: { type: Number, default: 0 },    // Número total de ratings
  averageRating: { type: Number, default: 0 }   // Rating promedio
}, { collection: 'Videojuego' });

// Middleware para calcular el rating promedio antes de guardar
videojuegoSchema.pre('save', function(next) {
  if (this.ratingCount > 0) {
    this.averageRating = this.totalRating / this.ratingCount;
  }
  next();
});

module.exports = mongoose.model('Videojuego', videojuegoSchema);
