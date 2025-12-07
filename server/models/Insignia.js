const mongoose = require('mongoose');

const insigniaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  imagen: {
    type: String,
    required: true
  },
  usuarios: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona'
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Insignia', insigniaSchema); 