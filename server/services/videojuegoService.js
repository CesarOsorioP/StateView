// services/videojuegoService.js
const axios = require('axios');
const Videojuego = require('../models/Videojuego');

async function fetchVideojuegoFromRawg(tituloJuego) {
  try {
    const API_KEY = process.env.RAWG_API_KEY;

    // Paso 1: Buscar el videojuego por título en la API de RAWG
    const respuestaBusqueda = await axios.get('https://api.rawg.io/api/games', {
      params: {
        search: tituloJuego,
        key: API_KEY
      }
    });

    if (!respuestaBusqueda.data.results || respuestaBusqueda.data.results.length === 0) {
      throw new Error('No se encontró el videojuego.');
    }

    // Tomamos el primer resultado de la búsqueda
    const resultadoBusqueda = respuestaBusqueda.data.results[0];
    const idJuego = resultadoBusqueda.id;

    // Paso 2: Obtener los detalles completos del videojuego usando su ID
    return await fetchVideojuegoFromRawgById(idJuego);
  } catch (error) {
    console.error('Error al obtener el videojuego desde RAWG API:', error.message);
    throw error;
  }
}

async function fetchVideojuegoFromRawgById(idJuego) {
  try {
    const API_KEY = process.env.RAWG_API_KEY;
    const respuestaDetalle = await axios.get(`https://api.rawg.io/api/games/${idJuego}`, {
      params: {
        key: API_KEY
      }
    });

    if (!respuestaDetalle.data) {
      throw new Error('No se pudieron obtener los detalles del videojuego.');
    }

    const data = respuestaDetalle.data;

    // Mapeo de datos
    const juego_id = data.id.toString();  
    const titulo = data.name;
    const desarrolladora = data.developers
      ? data.developers.map(dev => dev.name).join(', ')
      : '';
    const publicadora = data.publishers
      ? data.publishers.map(pub => pub.name).join(', ')
      : '';
    const plataformas = data.platforms
      ? data.platforms.map(p => p.platform.name).join(', ')
      : '';
    const genero = data.genres
      ? data.genres.map(gen => gen.name).join(', ')
      : '';
    const fecha_lanzamiento = data.released;
    const sinopsis = data.description_raw; // Texto plano de la descripción
    const imagen = data.background_image; // Enlace de la imagen

    const videojuegoData = {
      juego_id,
      titulo,
      desarrolladora,
      publicadora,
      plataformas,
      genero,
      fecha_lanzamiento,
      sinopsis,
      imagen
    };

    return videojuegoData;
  } catch (error) {
    console.error('Error al obtener el videojuego por ID desde RAWG API:', error.message);
    throw error;
  }
}

async function saveVideojuegoFromRawg(tituloJuego) {
  try {
    const videojuegoData = await fetchVideojuegoFromRawg(tituloJuego);
    // Verificar si el videojuego ya existe en la base de datos para evitar duplicados
    let videojuego = await Videojuego.findOne({ juego_id: videojuegoData.juego_id });
    if (!videojuego) {
      videojuego = new Videojuego(videojuegoData);
      const videojuegoGuardado = await videojuego.save();
      return videojuegoGuardado;
    }
    return videojuego;
  } catch (error) {
    console.error('Error al guardar el videojuego desde RAWG API:', error.message);
    throw error;
  }
}

async function saveVideojuegoById(idJuego) {
  try {
    const videojuegoData = await fetchVideojuegoFromRawgById(idJuego);
    let videojuego = await Videojuego.findOne({ juego_id: videojuegoData.juego_id });
    if (!videojuego) {
      videojuego = new Videojuego(videojuegoData);
      const videojuegoGuardado = await videojuego.save();
      return videojuegoGuardado;
    }
    return videojuego;
  } catch (error) {
    console.error('Error al guardar el videojuego por ID:', error.message);
    throw error;
  }
}

/**
 * Busca videojuegos en la RAWG API y devuelve múltiples resultados.
 */
async function searchVideojuegosEnRawg(query) {
  try {
    const API_KEY = process.env.RAWG_API_KEY;
    const response = await axios.get('https://api.rawg.io/api/games', {
      params: {
        search: query,
        key: API_KEY,
        page_size: 12 // Limitamos a 12 resultados
      }
    });

    if (!response.data.results) {
      throw new Error('No se encontraron resultados.');
    }

    // Mapear los resultados a un formato más amigable
    return response.data.results.map(game => ({
      imdbID: game.id.toString(), // Usamos imdbID para mantener consistencia con el frontend
      Title: game.name,
      Year: game.released ? game.released.split('-')[0] : 'N/A',
      Poster: game.background_image || '',
      Type: 'game',
      // Datos adicionales que podrían ser útiles
      Metacritic: game.metacritic || 'N/A',
      Rating: game.rating || 'N/A',
      Platforms: game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'N/A',
      // Datos necesarios para el refresh
      juego_id: game.id.toString(),
      titulo: game.name,
      desarrolladora: game.developers ? game.developers.map(dev => dev.name).join(', ') : '',
      publicadora: game.publishers ? game.publishers.map(pub => pub.name).join(', ') : '',
      plataformas: game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : '',
      genero: game.genres ? game.genres.map(gen => gen.name).join(', ') : '',
      fecha_lanzamiento: game.released,
      sinopsis: game.description_raw || '',
      imagen: game.background_image || ''
    }));
  } catch (error) {
    console.error('Error al buscar videojuegos en RAWG:', error.message);
    throw error;
  }
}

module.exports = { 
  fetchVideojuegoFromRawg, 
  saveVideojuegoFromRawg,
  searchVideojuegosEnRawg,
  saveVideojuegoById // New export
};
