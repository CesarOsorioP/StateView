// services/albumService.js
const axios = require('axios');
const Album = require('../models/Album');

/**
 * Función auxiliar para mapear los datos retornados por la API de Last.fm
 * a la estructura definida para nuestros álbumes.
 */
function mapearDatosAlbum(albumData) {
  // Determinar el identificador único: usaremos el mbid, si existe, o el nombre.
  const album_id =
    albumData.mbid && albumData.mbid.trim().length > 0
      ? albumData.mbid
      : albumData.name;
  const nombre = albumData.name;
  const artista = {
    artista_id: albumData.artistmbid || '',
    nombre: albumData.artist,
  };
  // Limpiar el releasedate (el campo puede venir con espacios o estar vacío)
  const fecha_estreno = albumData.releasedate ? albumData.releasedate.trim() : '';

  // Procesar canciones: inicializamos tracks como arreglo vacío
  let canciones = [];
  let tracks = [];
  
  // Intentamos obtener los datos de canciones de distintas propiedades
  if (albumData.tracks && albumData.tracks.track) {
    tracks = Array.isArray(albumData.tracks.track)
      ? albumData.tracks.track 
      : [albumData.tracks.track];
  } else if (albumData.track) {
    // Algunas respuestas pueden tener directamente "track"
    tracks = Array.isArray(albumData.track)
      ? albumData.track 
      : [albumData.track];
  }
  
  // Registrar en consola la estructura recibida para depurar
  console.log('Datos de tracks recibidos:', JSON.stringify(tracks, null, 2));

  if (tracks.length > 0) {
    canciones = tracks.map((track, index) => ({
      cancion_id:
        track.mbid && track.mbid.trim().length > 0
          ? track.mbid
          : `${album_id}-track-${index}`,
      titulo: track.name || 'Desconocido',
      // Aseguramos que duracion sea string. Si no se encuentra, se asigna "0"
      duracion: track.duration ? track.duration.toString() : '0',
      rating: 0,
    }));
  } else {
    console.log('No se encontraron canciones en la respuesta del álbum.');
  }
  
  // Elegir la imagen del tamaño deseado; se busca la imagen de tamaño "extralarge"
  let portada = '';
  if (albumData.image && Array.isArray(albumData.image)) {
    const imgExtralarge = albumData.image.find(img => img.size === 'extralarge');
    portada = (imgExtralarge && imgExtralarge['#text']) || '';
  }
  
  // Mostrar las canciones procesadas en consola para confirmar
  console.log('Canciones procesadas:', JSON.stringify(canciones, null, 2));

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
      // Si experimentas problemas con proxies, puedes desactivar el proxy agregando:
      // proxy: false
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
 * Además, si el álbum ya existe, se actualiza la lista de canciones.
 * @param {string} artistName Nombre del artista.
 * @param {string} albumName Nombre del álbum.
 * @returns {Promise<Object>} El álbum guardado o existente.
 */
async function saveAlbumFromLastfm(artistName, albumName) {
  try {
    // Obtiene y mapea los datos del álbum desde Last.fm.
    const albumData = await fetchAlbumFromLastfm(artistName, albumName);
    let album = await Album.findOne({ album_id: albumData.album_id });

    if (!album) {
      // Si el álbum no existe, lo crea.
      album = new Album(albumData);
      album = await album.save();
    } else {
      // Si ya existe, actualiza la lista de canciones (y otros campos si fuese necesario)
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
