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
  portada: { type: String }
}, { collection: 'Album' });

module.exports = mongoose.model('Album', albumSchema);
