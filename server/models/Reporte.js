const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reporteSchema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  review: {
    type: Schema.Types.ObjectId,
    ref: 'Review', // Opcional, solo si se está reportando una reseña en particular
    required: false
  },
  // Campo para almacenar el contenido reportado
  reportedContent: {
    texto: {
      type: String,
      required: false
    },
    tipo: {
      type: String,
      enum: ['Reseña', 'Comentario'],
      required: false
    },
    contenidoTitulo: {
      type: String,
      required: false
    },
    puntuacion: {
      type: Number,
      required: false
    },
    onModel: {
      type: String,
      required: false
    }
  },
  // Campos para el contenido reportado
  tipoContenido: {
    type: String,
    enum: ['Reseña', 'Comentario'],
    required: false
  },
  contenidoReportado: {
    type: String,
    required: false
  },
  // Campo para almacenar el texto de la reseña o comentario
  contenido: {
    type: String,
    required: false
  },
  motivo: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Resuelto', 'Rechazado'],
    default: 'Pendiente'
  },
  mod_id: {
    type: Schema.Types.ObjectId,
    ref: 'Persona' // Moderador que resuelve el reporte
  }
});

module.exports = mongoose.model('Reporte', reporteSchema);
