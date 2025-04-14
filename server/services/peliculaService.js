// services/peliculaService.js
const axios = require('axios');
const Pelicula = require('../models/Pelicula');

/**
 * Consulta la OMDb API utilizando el parámetro "t" (título) y mapea la respuesta.
 */
async function fetchPeliculaDesdeOMDb(title) {
  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY, // la clave almacenada en .env
        t: title,
        plot: 'short',  // Puedes usar 'full' si prefieres más detalle
        r: 'json'
      }
    });

    if (response.data.Response === "False") {
      throw new Error(response.data.Error);
    }

    // Mapeamos los datos de OMDb a los campos que necesitas.
    const peliculaDatos = {
      pelicula_id: response.data.imdbID,
      titulo: response.data.Title,
      director: response.data.Director,
      guionistas: response.data.Writer,
      actores: response.data.Actors,
      genero: response.data.Genre,
      fecha_estreno: response.data.Released,
      duracion: response.data.Runtime,
      imagen: response.data.Poster,
      sinopsis: response.data.Plot  // Aquí mapeamos el Plot al campo sinopsis
    };

    return peliculaDatos;
  } catch (error) {
    console.error('Error al obtener película desde OMDb:', error.message);
    throw error;
  }
}

/**
 * Guarda la película en la base de datos. Si ya existe (según pelicula_id), la retorna.
 */
async function savePeliculaFromOMDb(title) {
  try {
    const peliculaDatos = await fetchPeliculaDesdeOMDb(title);
    
    // Se evita duplicar utilizando el campo pelicula_id
    let pelicula = await Pelicula.findOne({ pelicula_id: peliculaDatos.pelicula_id });
    if (!pelicula) {
      pelicula = new Pelicula(peliculaDatos);
      const savedPelicula = await pelicula.save();
      return savedPelicula;
    }
    return pelicula;
  } catch (error) {
    console.error('Error al guardar la película:', error.message);
    throw error;
  }
}

module.exports = { fetchPeliculaDesdeOMDb, savePeliculaFromOMDb };
