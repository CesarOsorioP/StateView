// models/Persona.js
const mongoose = require('mongoose');

// Subesquema para insignias
const insigniaSchema = new mongoose.Schema({
  insignia_id: { type: String, required: true },
  nombre_insignia: { type: String, required: true },
  fecha_otorgada: { type: Date, default: Date.now },
  mod_id: { type: String } // ID del moderador que otorgó la insignia (opcional)
}, { _id: false });

// Subesquema para restricciones
const restriccionSchema = new mongoose.Schema({
  restriccion_id: { type: String, required: true },
  motivo: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  estado: { 
    type: String, 
    enum: ['Resuelta', 'Activa'], 
    default: 'Activa' 
  },
  mod_id: { type: String } // ID del moderador que impuso la restricción (opcional)
}, { _id: false });

// Subesquema para seguidores
const seguidorSchema = new mongoose.Schema({
  id_seguidor: { type: String, required: true },
  nombre_seguidor: { type: String, required: true }
}, { _id: false });

// Subesquema para las personas que el usuario sigue
const siguiendoSchema = new mongoose.Schema({
  id_persona_seguida: { type: String, required: true },
  nombre_persona_seguida: { type: String, required: true }
}, { _id: false });

// Esquema principal para Persona
const personaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fechaCreacion: { type: Date, default: Date.now },
  contraseña: { type: String, required: true },
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
  },
  insignias: [insigniaSchema],
  restricciones: [restriccionSchema],
  seguidores: [seguidorSchema],
  siguiendo: [siguiendoSchema]
}, { collection: 'Persona' });

module.exports = mongoose.model('Persona', personaSchema);
