const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const episodioSchema = new Schema({
  episodio_id: { type: String, required: true },
  episodio_numero: { type: String }, // Viene como string desde OMDb
  titulo: { type: String },
  duracion: { type: String },
  rating: { type: String }
});

const temporadaSchema = new Schema({
  temporada_id: { type: String, required: true },
  temporada_numero: { type: Number, required: true },
  episodios: [episodioSchema]
});

const serieSchema = new Schema({
  serie_id: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  creadores: { type: String },
  actores: { type: String },
  genero: { type: String },
  sinopsis: { type: String },
  poster: { type: String },          // URL de la imagen
  fechaInicio: { type: String },       // Fecha de inicio de la serie
  fechaFinal: { type: String },        // Fecha final de la serie (si existe)
  temporadas: { type: [temporadaSchema], default: [] }  // Arreglo de temporadas
});

module.exports = mongoose.model("series", serieSchema);
