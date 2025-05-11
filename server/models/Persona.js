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

// Subesquema para "Me gusta"
const meGustaSchema = new mongoose.Schema({
  contenido_id: { type: String, required: true },
  tipo: { type: String, required: true }, // Ej.: 'Pelicula', 'Album', etc.
  fecha: { type: Date, default: Date.now }
}, { _id: false });

// Subesquema para las listas creadas por el usuario
const listaSchema = new mongoose.Schema({
  lista_id: { type: String, required: true },
  nombre: { type: String, required: true },
  descripcion: { type: String },
  // Ítems que componen la lista
  items: [{
    contenido_id: { type: String, required: true },
    tipo: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
  }],
  fechaCreacion: { type: Date, default: Date.now }
}, { _id: false });

// Subesquema para Historial (para marcar contenidos ya vistos o escuchados)
const historialSchema = new mongoose.Schema({
  contenido_id: { type: String, required: true },
  // Se puede usar un enum para limitar los tipos o bien, ampliarlo si se requiere
  tipo: { type: String, enum: ['Pelicula', 'Album'], required: true },
  fecha: { type: Date, default: Date.now }
}, { _id: false });

// Esquema principal para Persona
const personaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fechaCreacion: { type: Date, default: Date.now },
  contraseña: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['Usuario', 'Critico', 'Moderador', 'Administrador' , 'Superadministrador'],
    default: 'Usuario'
  },
  imagenPerfil: { type: String },     // Se conserva para la foto de perfil
  imagenBanner: { type: String },       // Nuevo atributo para la imagen banner
  estado: { 
    type: String, 
    enum: ['Activo', 'Restringido', 'Advertido', 'Desactivado'],
    default: 'Activo'
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  insignias: [insigniaSchema],
  restricciones: [restriccionSchema],
  seguidores: [seguidorSchema],
  siguiendo: [siguiendoSchema],
  meGusta: [meGustaSchema],
  listas: [listaSchema],
  historial: [historialSchema]
}, { collection: 'Persona' });

module.exports = mongoose.model('Persona', personaSchema);
