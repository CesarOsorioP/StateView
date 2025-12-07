const mongoose = require('mongoose');

const listaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  esPublica: {
    type: Boolean,
    default: true
  },
  elementos: [{
    tipo: {
      type: String,
      enum: ['pelicula', 'serie', 'videojuego', 'album'],
      required: true
    },
    contenido: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'elementos.tipoModelo'
    },
    tipoModelo: {
      type: String,
      enum: ['Pelicula', 'Serie', 'Videojuego', 'Album'],
      required: true
    },
    // Denormalized fields
    titulo: { type: String },
    imagen: { type: String },
    rating: { type: Number },
    fechaAgregado: {
      type: Date,
      default: Date.now
    }
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de las búsquedas
listaSchema.index({ creador: 1 });
listaSchema.index({ esPublica: 1 });
listaSchema.index({ 'elementos.tipo': 1, 'elementos.contenido': 1 });

// Middleware para validar la referencia dinámica
listaSchema.pre('save', function(next) {
  const tiposPermitidos = ['pelicula', 'serie', 'videojuego', 'album'];
  const modelosPermitidos = ['Pelicula', 'Serie', 'Videojuego', 'Album'];
  
  for (const elemento of this.elementos) {
    if (!tiposPermitidos.includes(elemento.tipo)) {
      return next(new Error(`Tipo de contenido no válido: ${elemento.tipo}`));
    }
    if (!modelosPermitidos.includes(elemento.tipoModelo)) {
      return next(new Error(`Modelo no válido: ${elemento.tipoModelo}`));
    }
  }
  next();
});

// Asegurarse de que el modelo no esté ya registrado
const Lista = mongoose.models.Lista || mongoose.model('Lista', listaSchema);

module.exports = Lista;
