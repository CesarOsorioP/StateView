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
    console.error('Error al obtener el videojuego desde RAWG API:', error.message);
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

module.exports = { fetchVideojuegoFromRawg, saveVideojuegoFromRawg };
