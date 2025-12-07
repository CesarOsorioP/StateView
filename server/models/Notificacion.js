const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  tipo: {
    type: String,
    enum: ['like', 'comentario', 'seguidor'],
    required: true
  },
  contenido: {
    type: String,
    required: true
  },
  referencia: {
    tipo: {
      type: String,
      enum: ['reseña', 'comentario', 'usuario'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  emisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  leida: {
    type: Boolean,
    default: false
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

// Índices para mejorar el rendimiento de las consultas
notificacionSchema.index({ usuario: 1, fecha: -1 });
notificacionSchema.index({ leida: 1 });

const Notificacion = mongoose.model('Notificacion', notificacionSchema);

module.exports = Notificacion; 