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
  contenido_id: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Pelicula', 'Serie', 'Videojuego', 'Album'],
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
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
  contenido_id: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Pelicula', 'Serie', 'Videojuego', 'Album'],
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Subesquema para reseñas del usuario
const reviewSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  contenido: { type: String, required: true },
  itemId: { type: String, required: true },
  itemType: { type: String, enum: ['Pelicula', 'Serie', 'Videojuego', 'Album'], required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['Activo', 'Pendiente', 'Bloqueado', 'Eliminado'], default: 'Activo' }
}, { _id: false });

// Subesquema para comentarios del usuario
const commentSchema = new mongoose.Schema({
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  contenido: { type: String, required: true },
  reviewId: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['Activo', 'Eliminado'], default: 'Activo' }
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
  descripcion: { type: String, default: '' }, // Nueva descripción opcional
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
  historial: [historialSchema],
  reviews: [reviewSchema],      // Reseñas escritas por el usuario
  comments: [commentSchema]     // Comentarios escritos por el usuario
}, { collection: 'Persona' });

module.exports = mongoose.model('Persona', personaSchema);
