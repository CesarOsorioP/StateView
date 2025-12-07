// controllers/personaController.js
const PersonaService = require('../services/personaService');
const Persona = require('../models/Persona');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Album = require('../models/Album');
const Videojuego = require('../models/Videojuego');

/**
 * Crea una nueva Persona.
 */
async function crearPersona(req, res) {
  try {
    const nuevaPersona = await PersonaService.crearPersona(req.body);
    res.status(201).json({ message: 'Persona creada correctamente', data: nuevaPersona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene todas las Personas.
 */
async function obtenerPersonas(req, res) {
  try {
    const personas = await PersonaService.obtenerPersonas();
    res.status(200).json({ data: personas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene una Persona por su ID.
 */
async function obtenerPersona(req, res) {
  try {
    const persona = await PersonaService.obtenerPersonaPorId(req.params.id);
    res.status(200).json({ data: persona });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Edita o actualiza la información de una Persona.
 */
async function editarPersona(req, res) {
  try {
    const personaActualizada = await PersonaService.editarPersona(req.params.id, req.body);
    res.status(200).json({ message: 'Persona actualizada correctamente', data: personaActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualiza el estado de una Persona.
 */
async function actualizarEstadoPersona(req, res) {
  try {
    const personaActualizada = await PersonaService.actualizarEstadoPersona(req.params.id, req.body.estado);
    res.status(200).json({ message: 'Estado actualizado correctamente', data: personaActualizada });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/** HISTORIAL (visto/escuchado) */
async function agregarHistorial(req, res) {
  try {
    const { id } = req.params;
    const { contenido_id, tipo } = req.body;

    if (!contenido_id) {
      return res.status(400).json({
        success: false,
        message: 'contenido_id es requerido'
      });
    }

    // Buscar la persona
    const persona = await Persona.findById(id);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    // Verificar si el contenido ya está en el historial
    const existeEnHistorial = persona.historial.some(
      item => item.contenido_id && item.contenido_id.toString() === contenido_id.toString()
    );

    if (existeEnHistorial) {
      return res.status(400).json({
        success: false,
        message: 'El contenido ya está en el historial'
      });
    }

    // Determinar el tipo de contenido si no se proporciona
    let tipoContenido = tipo;
    if (!tipoContenido) {
      tipoContenido = await determinarTipoContenido(contenido_id);
    }

    // Agregar al historial
    const nuevoHistorial = {
      contenido_id: contenido_id,
      tipo: tipoContenido,
      fecha: new Date()
    };

    persona.historial.push(nuevoHistorial);
    await persona.save();

    res.status(200).json({
      success: true,
      message: 'Contenido agregado al historial',
      data: nuevoHistorial
    });

  } catch (error) {
    console.error('Error al agregar al historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

async function quitarHistorial(req, res) {
  try {
    const result = await PersonaService.quitarHistorial(req.params.id, req.body);
    res.status(200).json({ 
      success: true,
      message: 'Contenido quitado del historial', 
      data: result.historial 
    });
  } catch (error) {
    console.error('Error en quitarHistorial:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

async function obtenerHistorial(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, populate = false } = req.query;
    
    // Buscar la persona
    const persona = await Persona.findById(id);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    let historial = persona.historial || [];
    
    // Si se solicita populate, obtener los datos completos del contenido
    if (populate === 'true') {
      const historialPopulado = await Promise.all(
        historial.slice(0, parseInt(limit)).map(async (item) => {
          try {
            console.log(`[obtenerHistorial] Attempting to populate item: ID=${item.contenido_id}, Type=${item.tipo}`);
            let contenido = null;
            
            // Buscar en diferentes colecciones según el tipo
            if (item.tipo) {
              switch (item.tipo.toLowerCase()) {
                case 'pelicula':
                  contenido = await Pelicula.findById(item.contenido_id);
                  break;
                case 'serie':
                  contenido = await Serie.findOne({ serie_id: item.contenido_id });
                  break;
                case 'album':
                  contenido = await Album.findById(item.contenido_id);
                  break;
                case 'videojuego':
                  contenido = await Videojuego.findOne({ juego_id: item.contenido_id });
                  break;
                default:
                  // Buscar en todas las colecciones si no se especifica tipo
                  contenido = await buscarContenidoEnTodasLasColecciones(item.contenido_id);
              }
            } else {
              contenido = await buscarContenidoEnTodasLasColecciones(item.contenido_id);
            }

            return {
              ...item.toObject ? item.toObject() : item,
              contenido_id: contenido,
              contenido: contenido // Para compatibilidad
            };
          } catch (error) {
            console.error(`[obtenerHistorial] Error populating item (ID: ${item.contenido_id}, Type: ${item.tipo}):`, error);
            return item;
          }
        })
      );
      
      return res.status(200).json({
        success: true,
        data: historialPopulado
      });
    }
    
    // Sin populate, devolver solo los IDs
    return res.status(200).json({
      success: true,
      data: historial.slice(0, parseInt(limit))
    });
    
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

/** ME GUSTA */
async function agregarMeGusta(req, res) {
  try {
    const { id } = req.params;
    const { contenido_id, tipo } = req.body;

    if (!contenido_id) {
      return res.status(400).json({
        success: false,
        message: 'contenido_id es requerido'
      });
    }

    // Buscar la persona
    const persona = await Persona.findById(id);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    // Verificar si ya le gusta este contenido
    const existeEnMeGusta = persona.meGusta.some(
      item => item.contenido_id && item.contenido_id.toString() === contenido_id.toString()
    );

    if (existeEnMeGusta) {
      return res.status(400).json({
        success: false,
        message: 'Ya le gusta este contenido'
      });
    }

    // Determinar el tipo de contenido si no se proporciona
    let tipoContenido = tipo;
    if (!tipoContenido) {
      tipoContenido = await determinarTipoContenido(contenido_id);
    }

    // Agregar a me gusta
    const nuevoMeGusta = {
      contenido_id: contenido_id,
      tipo: tipoContenido,
      fecha: new Date()
    };

    persona.meGusta.push(nuevoMeGusta);
    await persona.save();

    res.status(200).json({
      success: true,
      message: 'Contenido agregado a me gusta',
      data: nuevoMeGusta
    });

  } catch (error) {
    console.error('Error al agregar me gusta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

async function quitarMeGusta(req, res) {
  try {
    const result = await PersonaService.quitarMeGusta(req.params.id, req.body);
    res.status(200).json({ 
      success: true,
      message: 'Contenido quitado de me gusta', 
      data: result.meGusta 
    });
  } catch (error) {
    console.error('Error en quitarMeGusta:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

async function obtenerMeGusta(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, populate = false } = req.query;
    
    // Buscar la persona
    const persona = await Persona.findById(id);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: 'Persona no encontrada'
      });
    }

    let meGusta = persona.meGusta || [];
    
    // Si se solicita populate, obtener los datos completos del contenido
    if (populate === 'true') {
      const meGustaPopulado = await Promise.all(
        meGusta.slice(0, parseInt(limit)).map(async (item) => {
          try {
            console.log(`[obtenerMeGusta] Attempting to populate item: ID=${item.contenido_id}, Type=${item.tipo}`);
            let contenido = null;
            
            // Buscar en diferentes colecciones según el tipo
            if (item.tipo) {
              switch (item.tipo.toLowerCase()) {
                case 'pelicula':
                  contenido = await Pelicula.findById(item.contenido_id);
                  break;
                case 'serie':
                  contenido = await Serie.findOne({ serie_id: item.contenido_id });
                  break;
                case 'album':
                  contenido = await Album.findById(item.contenido_id);
                  break;
                case 'videojuego':
                  contenido = await Videojuego.findOne({ juego_id: item.contenido_id });
                  break;
                default:
                  contenido = await buscarContenidoEnTodasLasColecciones(item.contenido_id);
              }
            } else {
              contenido = await buscarContenidoEnTodasLasColecciones(item.contenido_id);
            }

            return {
              ...item.toObject ? item.toObject() : item,
              contenido_id: contenido,
              contenido: contenido // Para compatibilidad
            };
          } catch (error) {
            console.error(`[obtenerMeGusta] Error populating item (ID: ${item.contenido_id}, Type: ${item.tipo}):`, error);
            return item;
          }
        })
      );
      
      return res.status(200).json({
        success: true,
        data: meGustaPopulado
      });
    }
    
    // Sin populate, devolver solo los IDs
    return res.status(200).json({
      success: true,
      data: meGusta.slice(0, parseInt(limit))
    });
    
  } catch (error) {
    console.error('Error al obtener me gusta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

// Función auxiliar para determinar el tipo de contenido
const determinarTipoContenido = async (contenidoId) => {
  const modelos = [
    { modelo: Pelicula, tipo: 'Pelicula' },
    { modelo: Serie, tipo: 'Serie' },
    { modelo: Album, tipo: 'Album' },
    { modelo: Videojuego, tipo: 'Videojuego' }
  ];
  
  for (const { modelo, tipo } of modelos) {
    try {
      const contenido = await modelo.findById(contenidoId);
      if (contenido) {
        return tipo;
      }
    } catch (error) {
      continue;
    }
  }
  
  return 'desconocido';
};

// Función auxiliar para buscar contenido en todas las colecciones
const buscarContenidoEnTodasLasColecciones = async (contenidoId) => {
  const modelos = [
    Pelicula,
    { modelo: Serie, idField: 'serie_id' }, 
    Album,
    { modelo: Videojuego, idField: 'juego_id' }
  ];
  
  for (const Modelo of modelos) {
    try {
      // Check if Modelo is an object with a specific idField
      const currentModel = Modelo.modelo || Modelo;
      const idField = Modelo.idField || '_id';
      const query = { [idField]: contenidoId };

      const contenido = await currentModel.findOne(query);
      if (contenido) {
        return contenido;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
};

module.exports = {
  crearPersona,
  obtenerPersonas,
  obtenerPersona,
  editarPersona,
  actualizarEstadoPersona,
  agregarHistorial,
  quitarHistorial,
  obtenerHistorial,
  agregarMeGusta,
  quitarMeGusta,
  obtenerMeGusta
};
