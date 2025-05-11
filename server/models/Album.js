// models/Album.js
const mongoose = require('mongoose');

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
