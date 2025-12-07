const listaRepository = require('../repositories/ListaRepository');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Videojuego = require('../models/Videojuego');
const Album = require('../models/Album');

const MODEL_MAP = {
  'Pelicula': Pelicula,
  'Serie': Serie,
  'Videojuego': Videojuego,
  'Album': Album
};

class ListaService {
  async crearLista(listaData) {
    try {
      return await listaRepository.crearLista(listaData);
    } catch (error) {
      throw new Error(`Error al crear la lista: ${error.message}`);
    }
  }

  async obtenerListaPorId(id) {
    try {
      const lista = await listaRepository.obtenerListaPorId(id);
      if (!lista) {
        throw new Error('Lista no encontrada');
      }
      return lista;
    } catch (error) {
      throw new Error(`Error al obtener la lista: ${error.message}`);
    }
  }

  async obtenerListasPorUsuario(usuarioId) {
    try {
      return await listaRepository.obtenerListasPorUsuario(usuarioId);
    } catch (error) {
      throw new Error(`Error al obtener las listas del usuario: ${error.message}`);
    }
  }

  async obtenerListasPublicas() {
    try {
      return await listaRepository.obtenerListasPublicas();
    } catch (error) {
      throw new Error(`Error al obtener las listas públicas: ${error.message}`);
    }
  }

  async actualizarLista(id, datosActualizados, usuarioId) {
    try {
      const lista = await listaRepository.obtenerListaPorId(id);
      if (!lista) {
        throw new Error('Lista no encontrada');
      }

      const creadorId = lista.creador._id ? lista.creador._id.toString() : lista.creador.toString();
      if (creadorId !== usuarioId) {
        throw new Error('No tienes permiso para actualizar esta lista');
      }

      return await listaRepository.actualizarLista(id, datosActualizados);
    } catch (error) {
      throw new Error(`Error al actualizar la lista: ${error.message}`);
    }
  }

  async eliminarLista(id, usuarioId) {
    try {
      const lista = await listaRepository.obtenerListaPorId(id);
      if (!lista) {
        throw new Error('Lista no encontrada');
      }

      const creadorId = lista.creador._id ? lista.creador._id.toString() : lista.creador.toString();
      if (creadorId !== usuarioId) {
        throw new Error('No tienes permiso para eliminar esta lista');
      }

      return await listaRepository.eliminarLista(id);
    } catch (error) {
      throw new Error(`Error al eliminar la lista: ${error.message}`);
    }
  }

  async agregarElemento(idLista, elemento, usuarioId) {
    try {
      console.log('Servicio - Datos recibidos:', { idLista, elemento, usuarioId });

      const lista = await listaRepository.obtenerListaPorId(idLista);
      console.log('Lista encontrada:', lista);

      if (!lista) {
        throw new Error('Lista no encontrada');
      }

      // Convertir ambos IDs a string para comparación
      const creadorId = lista.creador._id.toString();
      const usuarioIdStr = usuarioId.toString();

      console.log('Comparando IDs:', { creadorId, usuarioIdStr });

      if (creadorId !== usuarioIdStr) {
        console.log('Error de permisos:', {
          creadorLista: creadorId,
          usuarioId: usuarioIdStr
        });
        throw new Error('No tienes permiso para modificar esta lista');
      }

      // Verificar si el elemento ya existe en la lista
      const elementoExiste = lista.elementos.some(
        elem => elem.contenido.toString() === elemento.contenido.toString() && 
                elem.tipo === elemento.tipo
      );

      if (elementoExiste) {
        console.log('Elemento ya existe en la lista');
        throw new Error('El elemento ya existe en la lista');
      }

      // Verificar que el tipo de contenido sea válido
      const tiposPermitidos = ['pelicula', 'serie', 'videojuego', 'album'];
      if (!tiposPermitidos.includes(elemento.tipo)) {
        console.log('Tipo de contenido no válido:', elemento.tipo);
        throw new Error('Tipo de contenido no válido');
      }

      // Mapear el tipo al nombre del modelo
      const tipoModeloMap = {
        'pelicula': 'Pelicula',
        'serie': 'Serie',
        'videojuego': 'Videojuego',
        'album': 'Album'
      };

      const modelName = tipoModeloMap[elemento.tipo];
      const Model = MODEL_MAP[modelName];

      if (!Model) {
        throw new Error('Modelo de contenido no válido');
      }

      // Buscar el ítem para obtener los datos denormalizados
      const item = await Model.findById(elemento.contenido);
      if (!item) {
        throw new Error('Contenido no encontrado');
      }

      const elementoConModelo = {
        ...elemento,
        tipoModelo: modelName,
        titulo: item.titulo || item.nombre, // Pelicula/Serie use titulo, Album uses nombre
        imagen: item.imagen || item.portada || item.poster, // Different image fields
        rating: item.averageRating || 0
      };

      console.log('Intentando agregar elemento al repositorio:', elementoConModelo);
      const listaActualizada = await listaRepository.agregarElemento(idLista, elementoConModelo);
      console.log('Elemento agregado exitosamente:', listaActualizada);

      return listaActualizada;
    } catch (error) {
      console.error('Error en el servicio al agregar elemento:', error);
      throw new Error(`Error al agregar elemento a la lista: ${error.message}`);
    }
  }

  async eliminarElemento(idLista, idElemento, usuarioId) {
    try {
      const lista = await listaRepository.obtenerListaPorId(idLista);
      if (!lista) {
        throw new Error('Lista no encontrada');
      }

      const creadorId = lista.creador._id ? lista.creador._id.toString() : lista.creador.toString();
      if (creadorId !== usuarioId) {
        throw new Error('No tienes permiso para modificar esta lista');
      }

      return await listaRepository.eliminarElemento(idLista, idElemento);
    } catch (error) {
      throw new Error(`Error al eliminar elemento de la lista: ${error.message}`);
    }
  }

  async cambiarVisibilidad(idLista, esPublica, usuarioId) {
    try {
      const lista = await listaRepository.obtenerListaPorId(idLista);
      if (!lista) {
        throw new Error('Lista no encontrada');
      }

      const creadorId = lista.creador._id ? lista.creador._id.toString() : lista.creador.toString();
      if (creadorId !== usuarioId) {
        throw new Error('No tienes permiso para modificar esta lista');
      }

      return await listaRepository.cambiarVisibilidad(idLista, esPublica);
    } catch (error) {
      throw new Error(`Error al cambiar la visibilidad de la lista: ${error.message}`);
    }
  }
}

module.exports = new ListaService();
