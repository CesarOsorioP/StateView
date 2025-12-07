const contenidoService = require('../services/contenidoService');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Album = require('../models/Album');
const Videojuego = require('../models/Videojuego');
const Persona = require('../models/Persona');

class ContenidoController {
  async buscarContenido(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ 
          success: false,
          error: 'Se requiere un término de búsqueda' 
        });
      }

      // Búsqueda en paralelo
      const [peliculas, series, albumes, videojuegos, usuarios] = await Promise.all([
        Pelicula.find({
          $or: [
            { titulo: { $regex: q, $options: 'i' } },
            { descripcion: { $regex: q, $options: 'i' } }
          ]
        }).limit(10),
        Serie.find({
          $or: [
            { titulo: { $regex: q, $options: 'i' } },
            { descripcion: { $regex: q, $options: 'i' } }
          ]
        }).limit(10),
        Album.find({
          $or: [
            { nombre: { $regex: q, $options: 'i' } },
            { 'artista.nombre': { $regex: q, $options: 'i' } }
          ]
        }).limit(10),
        Videojuego.find({
          $or: [
            { titulo: { $regex: q, $options: 'i' } },
            { descripcion: { $regex: q, $options: 'i' } }
          ]
        }).limit(10),
        Persona.find({
          $or: [
            { nombre: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }).limit(10).select('nombre email imagenPerfil rol _id')
      ]);

      // Unificar resultados con campo type
      const results = [
        ...peliculas.map(item => ({ ...item.toObject(), type: 'pelicula' })),
        ...series.map(item => ({ ...item.toObject(), type: 'serie' })),
        ...albumes.map(item => ({ ...item.toObject(), type: 'album' })),
        ...videojuegos.map(item => ({ ...item.toObject(), type: 'videojuego' })),
        ...usuarios.map(item => ({ ...item.toObject(), type: 'usuario' }))
      ];

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async obtenerContenidoPorId(req, res) {
    try {
      const { id } = req.params;
      const contenido = await contenidoService.obtenerContenidoPorId(id);
      res.json(contenido);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new ContenidoController(); 