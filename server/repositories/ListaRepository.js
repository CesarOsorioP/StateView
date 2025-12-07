const Lista = require('../models/Lista');

class ListaRepository {
  async crearLista(listaData) {
    const lista = new Lista(listaData);
    return await lista.save();
  }

  async obtenerListaPorId(id) {
    return await Lista.findById(id)
      .populate('creador', 'nombre imagenPerfil')
      .populate('elementos.contenido');
  }

  async obtenerListasPorUsuario(usuarioId) {
    return await Lista.find({ creador: usuarioId })
      .populate('creador', 'nombre imagenPerfil')
      .populate('elementos.contenido');
  }

  async obtenerListasPublicas() {
    return await Lista.find({ esPublica: true })
      .populate('creador', 'nombre imagenPerfil')
      .populate('elementos.contenido');
  }

  async actualizarLista(id, datosActualizados) {
    return await Lista.findByIdAndUpdate(
      id,
      { ...datosActualizados, fechaActualizacion: Date.now() },
      { new: true }
    ).populate('creador', 'nombre imagenPerfil')
     .populate('elementos.contenido');
  }

  async eliminarLista(id) {
    return await Lista.findByIdAndDelete(id);
  }

  async agregarElemento(idLista, elemento) {
    try {
      console.log('Repositorio - Datos recibidos:', { idLista, elemento });

      const listaActualizada = await Lista.findByIdAndUpdate(
        idLista,
        { 
          $push: { 
            elementos: {
              ...elemento,
              fechaAgregado: Date.now()
            }
          },
          fechaActualizacion: Date.now()
        },
        { new: true }
      ).populate('creador', 'nombre imagenPerfil')
       .populate('elementos.contenido');

      console.log('Lista actualizada en el repositorio:', listaActualizada);

      if (!listaActualizada) {
        throw new Error('No se pudo actualizar la lista');
      }

      return listaActualizada;
    } catch (error) {
      console.error('Error en el repositorio al agregar elemento:', error);
      throw error;
    }
  }

  async eliminarElemento(idLista, idElemento) {
    return await Lista.findByIdAndUpdate(
      idLista,
      { 
        $pull: { elementos: { _id: idElemento } },
        fechaActualizacion: Date.now()
      },
      { new: true }
    ).populate('creador', 'nombre imagenPerfil')
     .populate('elementos.contenido');
  }

  async cambiarVisibilidad(idLista, esPublica) {
    return await Lista.findByIdAndUpdate(
      idLista,
      { 
        esPublica,
        fechaActualizacion: Date.now()
      },
      { new: true }
    ).populate('creador', 'nombre imagenPerfil')
     .populate('elementos.contenido');
  }
}

module.exports = new ListaRepository();
