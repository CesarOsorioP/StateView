// models/Serie.js
const mongoose = require("mongoose");

const episodioSchema = new mongoose.Schema({
  episodio_id: { type: String, required: true },
  episodio_numero: { type: String }, // Viene como string desde OMDb
  titulo: { type: String },
  duracion: { type: String },
  rating: { type: String }
});

const temporadaSchema = new mongoose.Schema({
  temporada_id: { type: String, required: true },
  temporada_numero: { type: Number, required: true },
  episodios: [episodioSchema]
});

const serieSchema = new mongoose.Schema({
  serie_id: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  creadores: { type: String },
  actores: { type: String },
  genero: { type: String },
  fecha_inicio: { type: String },
  fecha_final: { type: String },
  sinopsis: { type: String },    // Campo para almacenar la sinopsis
  temporadas: [temporadaSchema]
}, { collection: "Serie" });

module.exports = mongoose.model("Serie", serieSchema);
