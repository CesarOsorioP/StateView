// models/Album.js
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

const cancionSchema = new mongoose.Schema({
  cancion_id: { type: String, required: true },
  titulo: { type: String, required: true },
  duracion: { type: String },
  rating: { type: Number, default: 0 }
});

const albumSchema = new mongoose.Schema({
  album_id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  artista: {
    artista_id: { type: String },
    nombre: { type: String, required: true }
  },
  fecha_estreno: { type: String },
  canciones: [cancionSchema],
  portada: { type: String },
  reviews: [reviewDenormalizedSchema], // Denormalized reviews
  totalRating: { type: Number, default: 0 },    // Suma total de ratings
  ratingCount: { type: Number, default: 0 },    // Número total de ratings
  averageRating: { type: Number, default: 0 }   // Rating promedio
}, { collection: 'Album' });

// Middleware para calcular el rating promedio antes de guardar
albumSchema.pre('save', function(next) {
  if (this.ratingCount > 0) {
    this.averageRating = this.totalRating / this.ratingCount;
  }
  next();
});

module.exports = mongoose.model('Album', albumSchema);
