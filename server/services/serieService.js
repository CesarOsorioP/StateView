// services/serieService.js
const axios = require("axios");
const Serie = require("../models/Serie");

/**
 * Obtiene en detalle la información de un episodio a partir de su imdbID.
 */
async function fetchEpisodeDetail(episodeId) {
  try {
    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: episodeId,
        plot: "short",
        r: "json"
      }
    });
    if (response.data.Response === "False") {
      throw new Error(response.data.Error);
    }
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo detalles del episodio ${episodeId}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene la serie y sus temporadas, incluyendo detalles de episodios.
 */
async function fetchSerieDesdeOMDb(title) {
  try {
    // Obtener datos principales de la serie
    const serieRes = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: title,
        type: "series",
        plot: "short",
        r: "json"
      }
    });
    if (serieRes.data.Response === "False") {
      throw new Error(serieRes.data.Error);
    }
    const data = serieRes.data;
    const serie_id = data.imdbID;
    const titulo = data.Title;
    const creadores = data.Writer; // Usamos Writer como "creadores"
    const actores = data.Actors;
    const genero = data.Genre;
    
    // Extraer sinopsis de la serie (Plot)
    const sinopsis = data.Plot; 

    // Procesar el campo Year para obtener fecha de inicio y fecha final.
    let fecha_inicio = "";
    let fecha_final = "";
    if (data.Year) {
      const parts = data.Year.split("–");
      fecha_inicio = parts[0] || "";
      fecha_final = parts[1] || "";
    }

    const totalSeasons = parseInt(data.totalSeasons, 10);
    const temporadas = [];

    // Recorrer cada temporada
    for (let season = 1; season <= totalSeasons; season++) {
      const seasonRes = await axios.get("http://www.omdbapi.com/", {
        params: {
          apikey: process.env.OMDB_API_KEY,
          i: serie_id,
          Season: season
        }
      });
      if (seasonRes.data.Response === "False") {
        console.warn(`No se obtuvieron datos para la temporada ${season}: ${seasonRes.data.Error}`);
        continue;
      }
      const seasonData = seasonRes.data;
      
      // Para cada episodio de la temporada, obtenemos detalles adicionales.
      const episodiosPromises = seasonData.Episodes.map(async (episode) => {
        const episodeDetail = await fetchEpisodeDetail(episode.imdbID);
        return {
          episodio_id: episodeDetail.imdbID,
          episodio_numero: episodeDetail.Episode,
          titulo: episodeDetail.Title,
          duracion: episodeDetail.Runtime,
          rating: episodeDetail.imdbRating
        };
      });
      const episodios = await Promise.all(episodiosPromises);

      const temporadaObj = {
        temporada_id: `${serie_id}-S${season}`,
        temporada_numero: season,
        episodios: episodios
      };

      temporadas.push(temporadaObj);
    }

    // Armar el objeto de la serie, incluyendo la sinopsis
    const serieDatos = {
      serie_id,
      titulo,
      creadores,
      actores,
      genero,
      fecha_inicio,
      fecha_final,
      sinopsis,
      temporadas
    };

    return serieDatos;
  } catch (error) {
    console.error("Error obteniendo serie desde OMDb:", error.message);
    throw error;
  }
}

/**
 * Guarda la serie en la base de datos. Si ya existe, la retorna.
 */
async function saveSerieFromOMDb(title) {
  try {
    const serieDatos = await fetchSerieDesdeOMDb(title);
    let serie = await Serie.findOne({ serie_id: serieDatos.serie_id });
    if (!serie) {
      serie = new Serie(serieDatos);
      const savedSerie = await serie.save();
      return savedSerie;
    }
    return serie;
  } catch (error) {
    console.error("Error al guardar la serie:", error.message);
    throw error;
  }
}

module.exports = { fetchSerieDesdeOMDb, saveSerieFromOMDb };
