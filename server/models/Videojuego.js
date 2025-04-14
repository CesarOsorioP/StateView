// models/Videojuego.js
const mongoose = require('mongoose');

const videojuegoSchema = new mongoose.Schema({
  juego_id: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  desarrolladora: { type: String },
  publicadora: { type: String },
  plataformas: { type: String },
  genero: { type: String },
  fecha_lanzamiento: { type: String },
  sinopsis: { type: String },
  imagen: { type: String } // Campo para almacenar el enlace de la imagen
}, { collection: 'Videojuego' });

module.exports = mongoose.model('Videojuego', videojuegoSchema);
