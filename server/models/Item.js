// models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  fechaSalida: { type: String },
  genero: { type: String },
  rating: { type: Number },
  tipo: { 
    type: String,
    enum: ['Pelicula', 'Serie', 'Juego', 'Album'],
    required: true
  }
});

module.exports = mongoose.model('Item', itemSchema);
