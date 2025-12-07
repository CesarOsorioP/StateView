const listaService = require('../services/listaService');

class ListaController {
  async crearLista(req, res) {
    try {
      const listaData = {
        ...req.body,
        creador: req.user.id
      };
      const lista = await listaService.crearLista(listaData);
      res.status(201).json({
        success: true,
        data: lista
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async obtenerListaPorId(req, res) {
    try {
      const lista = await listaService.obtenerListaPorId(req.params.id);
      
      // Si la lista no es pública y el usuario no es el creador, denegar acceso
      if (!lista.esPublica && (!req.user || lista.creador._id.toString() !== req.user.id)) {
        return res.status(403).json({ 
          success: false,
          error: 'No tienes permiso para ver esta lista' 
        });
      }

      res.json({ 
        success: true,
        data: lista 
      });
    } catch (error) {
      res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async obtenerListasPorUsuario(req, res) {
    try {
      // Si no hay usuarioId en los parámetros, usar el ID del usuario actual
      const usuarioId = req.params.usuarioId || req.user.id;
      const listas = await listaService.obtenerListasPorUsuario(usuarioId);
      res.json({
        success: true,
        data: listas
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async obtenerListasPublicas(req, res) {
    try {
      const listas = await listaService.obtenerListasPublicas();
      res.json({ data: listas });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async actualizarLista(req, res) {
    try {
      const lista = await listaService.actualizarLista(
        req.params.id,
        req.body,
        req.user.id
      );
      res.json({ data: lista });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async eliminarLista(req, res) {
    try {
      await listaService.eliminarLista(req.params.id, req.user.id);
      res.json({ message: 'Lista eliminada exitosamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async agregarElemento(req, res) {
    try {
      const { tipo, contenido } = req.body;
      console.log('Datos recibidos:', { tipo, contenido, userId: req.user.id });
      
      // Validar que se proporcionen todos los campos necesarios
      if (!tipo || !contenido) {
        console.log('Faltan campos requeridos:', { tipo, contenido });
        return res.status(400).json({
          success: false,
          error: 'Se requieren los campos tipo y contenido'
        });
      }

      // Validar que el tipo sea uno de los valores permitidos
      const tiposPermitidos = ['pelicula', 'serie', 'videojuego', 'album'];
      if (!tiposPermitidos.includes(tipo)) {
        console.log('Tipo no válido:', tipo);
        return res.status(400).json({
          success: false,
          error: 'Tipo de contenido no válido'
        });
      }

      // Verificar que el usuario esté autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      console.log('Intentando agregar elemento a la lista:', {
        listaId: req.params.id,
        elemento: { tipo, contenido },
        userId: req.user.id
      });

      const lista = await listaService.agregarElemento(
        req.params.id,
        { tipo, contenido },
        req.user.id
      );

      console.log('Elemento agregado exitosamente:', lista);

      res.json({
        success: true,
        data: lista
      });
    } catch (error) {
      console.error('Error al agregar elemento:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async eliminarElemento(req, res) {
    try {
      console.log('Eliminando elemento:', {
        listaId: req.params.id,
        elementoId: req.params.elementoId,
        userId: req.user?.id
      });

      const lista = await listaService.eliminarElemento(
        req.params.id,
        req.params.elementoId,
        req.user.id
      );
      
      res.json({ 
        success: true,
        data: lista 
      });
    } catch (error) {
      console.error('Error al eliminar elemento:', error);
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async cambiarVisibilidad(req, res) {
    try {
      const lista = await listaService.cambiarVisibilidad(
        req.params.id,
        req.body.esPublica,
        req.user.id
      );
      res.json({ 
        success: true,
        data: lista 
      });
    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

module.exports = new ListaController();
