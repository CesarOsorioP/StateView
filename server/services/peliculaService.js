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
 * Consulta la OMDb API utilizando el parámetro "i" (IMDb ID) y mapea la respuesta.
 */
async function fetchPeliculaDesdeOMDbById(imdbId) {
  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbId,
        plot: 'full',
        r: 'json'
      }
    });

    if (response.data.Response === "False") {
      throw new Error(response.data.Error);
    }

    // Mapeamos los datos de OMDb
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
      sinopsis: response.data.Plot,
      totalRating: 0,
      ratingCount: 0,
      averageRating: 0,
      reviews: []
    };

    return peliculaDatos;
  } catch (error) {
    console.error('Error al obtener película por ID desde OMDb:', error.message);
    throw error;
  }
}

/**
 * Guarda la película en la base de datos buscando por IMDb ID.
 */
async function savePeliculaFromOMDbById(imdbId) {
  try {
    // Verificar si ya existe en la BD
    let pelicula = await Pelicula.findOne({ pelicula_id: imdbId });
    if (pelicula) {
      return pelicula;
    }

    const peliculaDatos = await fetchPeliculaDesdeOMDbById(imdbId);
    pelicula = new Pelicula(peliculaDatos);
    const savedPelicula = await pelicula.save();
    return savedPelicula;
  } catch (error) {
    console.error('Error al guardar la película por ID:', error.message);
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

/**
 * Busca películas en la OMDb API utilizando el parámetro "s" (search) y devuelve múltiples resultados.
 */
async function searchPeliculasEnOMDb(query) {
  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: query,
        type: 'movie',
        r: 'json'
      }
    });

    if (response.data.Response === "False") {
      throw new Error(response.data.Error);
    }

    return response.data.Search || [];
  } catch (error) {
    console.error('Error al buscar películas en OMDb:', error.message);
    throw error;
  }
}

module.exports = { 
  fetchPeliculaDesdeOMDb, 
  savePeliculaFromOMDb,
  searchPeliculasEnOMDb,
  savePeliculaFromOMDbById,
  fetchPeliculaDesdeOMDbById
};
