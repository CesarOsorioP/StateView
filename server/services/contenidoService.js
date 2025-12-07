const Contenido = require('../models/Contenido');

class ContenidoService {
  async buscarContenido(query) {
    try {
      const resultados = await Contenido.find({
        $or: [
          { titulo: { $regex: query, $options: 'i' } },
          { descripcion: { $regex: query, $options: 'i' } }
        ]
      }).limit(20);

      return resultados;
    } catch (error) {
      throw new Error('Error al buscar contenido: ' + error.message);
    }
  }

  async obtenerContenidoPorId(id) {
    try {
      const contenido = await Contenido.findById(id);
      if (!contenido) {
        throw new Error('Contenido no encontrado');
      }
      return contenido;
    } catch (error) {
      throw new Error('Error al obtener contenido: ' + error.message);
    }
  }
}

module.exports = new ContenidoService(); 