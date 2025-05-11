// models/Pelicula.js
const mongoose = require('mongoose');

const peliculaSchema = new mongoose.Schema({
  pelicula_id: { type: String, required: true, unique: true }, // Usamos imdbID
  titulo: { type: String, required: true },
  director: { type: String },
  guionistas: { type: String },
  actores: { type: String },
  genero: { type: String },
  fecha_estreno: { type: String },  // Puedes usar String o convertirlo a Date
  duracion: { type: String },        // Por ejemplo, "136 min"
  imagen: { type: String },          // URL del póster
  sinopsis: { type: String },        // Se almacenará el Plot (sinopsis) de la película
  totalRating: { type: Number, default: 0 },    // Suma total de ratings
  ratingCount: { type: Number, default: 0 },    // Número total de ratings
  averageRating: { type: Number, default: 0 }   // Rating promedio
}, { collection: 'Pelicula' });

// Middleware para calcular el rating promedio antes de guardar
peliculaSchema.pre('save', function(next) {
  if (this.ratingCount > 0) {
    this.averageRating = this.totalRating / this.ratingCount;
  }
  next();
});

module.exports = mongoose.model('Pelicula', peliculaSchema);
