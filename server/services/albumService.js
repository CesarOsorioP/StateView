const axios = require('axios');
const Album = require('../models/Album');

/**
 * Función auxiliar para mapear los datos retornados por la API de Last.fm
 * a la estructura definida para nuestros álbumes.
 */
function mapearDatosAlbum(albumData) {
  // Usamos el mbid como identificador si está disponible
  const album_id =
    albumData.mbid && albumData.mbid.trim().length > 0
      ? albumData.mbid
      : albumData.name;
  const nombre = albumData.name;
  const artista = {
    artista_id: albumData.artistmbid || '', // Puede ser vacío si no existe
    nombre: albumData.artist,
  };
  // Se limpia el releasedate
  const fecha_estreno = albumData.releasedate ? albumData.releasedate.trim() : '';

  // Procesar canciones
  let canciones = [];
  if (albumData.tracks && albumData.tracks.track) {
    // Garantizamos que tracks.track sea un array, incluso si es un único objeto
    const tracks = Array.isArray(albumData.tracks.track)
      ? albumData.tracks.track
      : [albumData.tracks.track];
      
    canciones = tracks.map((track, index) => ({
      cancion_id:
        track.mbid && track.mbid.trim().length > 0
          ? track.mbid
          : `${album_id}-track-${index}`,
      titulo: track.name || 'Desconocido',
      duracion: track.duration || '0',
      rating: 0,
    }));
  }
  
  // Muestra en consola lo que se procesó para depuración
  console.log('Canciones procesadas:', JSON.stringify(canciones, null, 2));

  // Elegimos la imagen del tamaño deseado, con un fallback a una imagen vacía
  let portada = '';
  if (albumData.image && Array.isArray(albumData.image)) {
    const imgExtralarge = albumData.image.find((img) => img.size === 'extralarge');
    portada = (imgExtralarge && imgExtralarge['#text']) || '';
  }

  return {
    album_id,
    nombre,
    artista,
    fecha_estreno,
    canciones,
    portada,
  };
}

/**
 * Consulta la API de Last.fm para obtener la información de un álbum.
 * @param {string} artistName Nombre del artista.
 * @param {string} albumName Nombre del álbum.
 * @returns {Promise<Object>} Datos del álbum mapeados a nuestra estructura.
 */
async function fetchAlbumFromLastfm(artistName, albumName) {
  try {
    const API_KEY = process.env.LASTFM_API_KEY;
    const { data } = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'album.getInfo',
        api_key: API_KEY,
        artist: artistName,
        album: albumName,
        format: 'json',
      },
    });

    // Si la API devuelve un error
    if (data.error) {
      throw new Error(data.message);
    }

    const albumData = data.album;
    if (!albumData) {
      throw new Error('No se encontró información para el álbum.');
    }

    return mapearDatosAlbum(albumData);
  } catch (error) {
    console.error('Error al obtener el álbum desde Last.fm:', error.message);
    if (error.response && error.response.data) {
      console.error('Detalle del error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Guarda un álbum en la base de datos consultándolo desde Last.fm.
 * Se evita duplicar la entrada comprobando el album_id.
 * @param {string} artistName Nombre del artista.
 * @param {string} albumName Nombre del álbum.
 * @returns {Promise<Object>} El álbum guardado o existente.
 */
async function saveAlbumFromLastfm(artistName, albumName) {
  try {
    // Obtiene los datos del álbum y los mapea
    const albumData = await fetchAlbumFromLastfm(artistName, albumName);
    let album = await Album.findOne({ album_id: albumData.album_id });

    if (!album) {
      // Si el álbum no existe, lo crea
      album = new Album(albumData);
      album = await album.save();
    } else {
      // Si ya existe, actualiza la información de las canciones
      album.canciones = albumData.canciones;
      album = await album.save();
    }

    return album;
  } catch (error) {
    console.error('Error al guardar el álbum desde Last.fm:', error.message);
    throw error;
  }
}

module.exports = { fetchAlbumFromLastfm, saveAlbumFromLastfm };
