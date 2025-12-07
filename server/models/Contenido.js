  const mongoose = require('mongoose');

const contenidoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['pelicula', 'serie', 'videojuego', 'album']
  },
  poster: {
    type: String,
    trim: true
  },
  portada: {
    type: String,
    trim: true
  },
  fechaLanzamiento: {
    type: Date
  },
  generos: [{
    type: String,
    trim: true
  }],
  creador: {
    type: String,
    trim: true
  },
  plataforma: {
    type: String,
    trim: true
  },
  duracion: {
    type: String,
    trim: true
  },
  calificacion: {
    type: Number,
    min: 0,
    max: 10
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsqueda
contenidoSchema.index({ titulo: 'text', descripcion: 'text' });

// Middleware para actualizar fechaActualizacion
contenidoSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

module.exports = mongoose.model('Contenido', contenidoSchema); 