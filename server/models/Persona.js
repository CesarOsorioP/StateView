// models/Persona.js
const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fechaCreacion: { type: Date, default: Date.now },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['Usuario', 'Crítico', 'Moderador', 'Administrador'],
    default: 'Usuario'
  },
  imagenPerfil: { type: String },
  estado: { 
    type: String, 
    enum: ['Activo', 'Restringido', 'Advertido', 'Desactivado'],
    default: 'Activo'
  }
}, { collection: 'Persona' }); // Aquí se fuerza el nombre de la colección

module.exports = mongoose.model('Persona', personaSchema);
