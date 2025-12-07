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
    if (!response.data || response.data.Response === "False") {
      throw new Error(response.data?.Error || "No se pudo obtener información del episodio.");
    }
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo detalles del episodio ${episodeId}:`, error.message);
    throw error;
  }
}

/**
 * Procesa los datos crudos de OMDb y obtiene las temporadas/episodios
 */
async function processSerieData(data) {
    const serie_id = data.imdbID;
    const titulo = data.Title;
    const creadores = data.Writer;
    const actores = data.Actors;
    const genero = data.Genre;
    const sinopsis = data.Plot;
    const poster = data.Poster; // Extraer la imagen

    // Procesar el campo Year para obtener fechaInicio y fechaFinal
    let fechaInicio = "";
    let fechaFinal = "";
    if (data.Year) {
      const parts = data.Year.split("–");
      fechaInicio = parts[0] || "";
      fechaFinal = parts[1] || "";
    }

    const totalSeasons = parseInt(data.totalSeasons, 10);
    const temporadas = [];

    // Recorrer cada temporada
    // Nota: Limitamos a las primeras 10 temporadas por rendimiento si es necesario, 
    // pero OMDb es rápido. Sin embargo, iterar muchas temporadas puede ser lento.
    // Se deja tal cual estaba en el código original.
    for (let season = 1; season <= totalSeasons; season++) {
      const seasonRes = await axios.get("http://www.omdbapi.com/", {
        params: {
          apikey: process.env.OMDB_API_KEY,
          i: serie_id,
          Season: season
        }
      });

      if (!seasonRes.data || seasonRes.data.Response === "False") {
        console.warn(`No se obtuvieron datos para la temporada ${season}: ${seasonRes.data?.Error || "No disponible"}`);
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

      temporadas.push({
        temporada_id: `${serie_id}-S${season}`,
        temporada_numero: season,
        episodios
      });
    }

    return {
      serie_id,
      titulo,
      creadores,
      actores,
      genero,
      sinopsis,
      poster,
      fechaInicio,
      fechaFinal,
      temporadas
    };
}

/**
 * Obtiene la serie y sus temporadas desde OMDb por título
 */
async function fetchSerieDesdeOMDb(title) {
  try {
    const serieRes = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        t: title,
        type: "series",
        plot: "short",
        r: "json"
      }
    });

    if (!serieRes.data || serieRes.data.Response === "False") {
      throw new Error(serieRes.data?.Error || "Serie no encontrada en OMDb API.");
    }

    return await processSerieData(serieRes.data);
  } catch (error) {
    console.error("Error obteniendo serie desde OMDb:", error.message);
    throw error;
  }
}

/**
 * Obtiene la serie y sus temporadas desde OMDb por ID
 */
async function fetchSerieDesdeOMDbById(imdbId) {
  try {
    const serieRes = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: imdbId,
        type: "series",
        plot: "short",
        r: "json"
      }
    });

    if (!serieRes.data || serieRes.data.Response === "False") {
      throw new Error(serieRes.data?.Error || "Serie no encontrada en OMDb API.");
    }

    return await processSerieData(serieRes.data);
  } catch (error) {
    console.error("Error obteniendo serie desde OMDb por ID:", error.message);
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
      await serie.save();
    }
    return serie;
  } catch (error) {
    console.error("Error al guardar la serie:", error.message);
    throw error;
  }
}

/**
 * Guarda la serie en la base de datos por ID. Si ya existe, la retorna.
 */
async function saveSerieById(imdbId) {
  try {
    const serieDatos = await fetchSerieDesdeOMDbById(imdbId);
    let serie = await Serie.findOne({ serie_id: serieDatos.serie_id });
    if (!serie) {
      serie = new Serie(serieDatos);
      await serie.save();
    }
    return serie;
  } catch (error) {
    console.error("Error al guardar la serie por ID:", error.message);
    throw error;
  }
}

/**
 * Busca series en la OMDb API utilizando el parámetro "s" (search) y devuelve múltiples resultados.
 */
async function searchSeriesEnOMDb(query) {
  try {
    const response = await axios.get("http://www.omdbapi.com/", {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: query,
        type: "series",
        r: "json"
      }
    });

    if (response.data.Response === "False") {
      throw new Error(response.data.Error);
    }

    return response.data.Search || [];
  } catch (error) {
    console.error("Error al buscar series en OMDb:", error.message);
    throw error;
  }
}

module.exports = { 
  fetchSerieDesdeOMDb, 
  saveSerieFromOMDb,
  searchSeriesEnOMDb,
  saveSerieById // New export
};
