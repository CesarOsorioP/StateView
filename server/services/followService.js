// services/FollowService.js
const PersonaRepository = require('../repositories/PersonaRepository');
const PersonaFactory = require('../factories/PersonaFactory');
const mongoose = require('mongoose');
const { crearNotificacion } = require('../controllers/notificacionController');

class FollowService {
  /**
   * Hace que un usuario siga a otro.
   * @param {String} seguidorId - ID del usuario que quiere seguir
   * @param {String} seguidoId - ID del usuario a seguir
   * @returns {Promise<Object>} Objeto con información de la operación
   */
  async followUser(seguidorId, seguidoId) {
    // Validar que los IDs son diferentes
    if (seguidorId === seguidoId) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    try {
      // Buscar ambos usuarios
      const seguidor = await PersonaRepository.findById(seguidorId);
      const seguido = await PersonaRepository.findById(seguidoId);

      if (!seguidor || !seguido) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar si ya lo sigue
      const yaLoSigue = await PersonaRepository.isFollowing(seguidorId, seguidoId);
      if (yaLoSigue) {
        throw new Error('Ya sigues a este usuario');
      }

      // Crear objetos para los arrays de seguidores y siguiendo
      const seguidorObj = PersonaFactory.createSeguidor(seguidor._id, seguidor.nombre);
      const siguiendoObj = PersonaFactory.createSiguiendo(seguido._id, seguido.nombre);

      // Actualizar ambos usuarios en paralelo
      const [seguidorActualizado, seguidoActualizado] = await Promise.all([
        PersonaRepository.addSiguiendo(seguidorId, siguiendoObj),
        PersonaRepository.addSeguidor(seguidoId, seguidorObj)
      ]);

      // Crear notificación para el usuario seguido
      try {
        await crearNotificacion(
          seguidoId,
          'seguidor',
          `${seguidor.nombre} ha comenzado a seguirte.`,
          { tipo: 'usuario', id: seguidorId },
          seguidorId
        );
      } catch (notifError) {
        console.error('Error al crear notificación de seguidor:', notifError);
        // No interrumpimos el flujo si falla la notificación
      }

      return {
        success: true,
        message: `Ahora sigues a ${seguido.nombre}`,
        siguiendo: seguidorActualizado.siguiendo.length,
        seguidores: seguidoActualizado.seguidores.length
      };
    } catch (error) {
      console.error('[followUser] Error:', error);
      throw error;
    }
  }

  /**
   * Hace que un usuario deje de seguir a otro.
   * @param {String} seguidorId - ID del usuario que quiere dejar de seguir
   * @param {String} seguidoId - ID del usuario a dejar de seguir
   * @returns {Promise<Object>} Objeto con información de la operación
   */
  async unfollowUser(seguidorId, seguidoId) {
    if (seguidorId === seguidoId) {
      throw new Error('No puedes dejar de seguirte a ti mismo');
    }

    try {
      // Buscar ambos usuarios
      const seguidor = await PersonaRepository.findById(seguidorId);
      const seguido = await PersonaRepository.findById(seguidoId);

      if (!seguidor || !seguido) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar si lo está siguiendo
      const esSeguidor = await PersonaRepository.isFollowing(seguidorId, seguidoId);
      if (!esSeguidor) {
        throw new Error('No sigues a este usuario');
      }

      // Actualizar ambos usuarios en paralelo
      const [seguidorActualizado, seguidoActualizado] = await Promise.all([
        PersonaRepository.removeSiguiendo(seguidorId, seguidoId),
        PersonaRepository.removeSeguidor(seguidoId, seguidorId)
      ]);

      return {
        success: true,
        message: `Has dejado de seguir a ${seguido.nombre}`,
        siguiendo: seguidorActualizado.siguiendo.length,
        seguidores: seguidoActualizado.seguidores.length
      };
    } catch (error) {
      console.error('[unfollowUser] Error:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de seguidores de un usuario.
   * @param {String} userId - ID del usuario
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Lista de seguidores con imagenPerfil
   */
  async getSeguidores(userId, options = { limit: 10, page: 1 }) {
    try {
      const usuario = await PersonaRepository.findById(userId);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      const { limit, page } = options;
      const seguidores = usuario.seguidores || [];
      const paged = (limit && page) ? seguidores.slice((page - 1) * limit, (page - 1) * limit + limit) : seguidores;
      // Buscar la imagen de perfil de cada seguidor
      const seguidoresConImagen = await Promise.all(
        paged.map(async (seg) => {
          const persona = await PersonaRepository.findById(seg.id_seguidor);
          return {
            id: seg.id_seguidor,
            nombre: seg.nombre_seguidor,
            imagenPerfil: persona && persona.imagenPerfil ? persona.imagenPerfil : null
          };
        })
      );
      return seguidoresConImagen;
    } catch (error) {
      console.error('[getSeguidores] Error:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de usuarios que sigue un usuario.
   * @param {String} userId - ID del usuario
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Lista de usuarios seguidos con imagenPerfil
   */
  async getSiguiendo(userId, options = { limit: 10, page: 1 }) {
    try {
      const usuario = await PersonaRepository.findById(userId);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      const { limit, page } = options;
      const siguiendo = usuario.siguiendo || [];
      const paged = (limit && page) ? siguiendo.slice((page - 1) * limit, (page - 1) * limit + limit) : siguiendo;
      // Buscar la imagen de perfil de cada seguido
      const siguiendoConImagen = await Promise.all(
        paged.map(async (sig) => {
          const persona = await PersonaRepository.findById(sig.id_persona_seguida);
          return {
            id: sig.id_persona_seguida,
            nombre: sig.nombre_persona_seguida,
            imagenPerfil: persona && persona.imagenPerfil ? persona.imagenPerfil : null
          };
        })
      );
      return siguiendoConImagen;
    } catch (error) {
      console.error('[getSiguiendo] Error:', error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario sigue a otro.
   * @param {String} seguidorId - ID del posible seguidor
   * @param {String} seguidoId - ID del posible seguido
   * @returns {Promise<Boolean>} true si lo sigue, false si no
   */
  async isFollowing(seguidorId, seguidoId) {
    try {
      return await PersonaRepository.isFollowing(seguidorId, seguidoId);
    } catch (error) {
      console.error('[isFollowing] Error:', error);
      throw error;
    }
  }
}

module.exports = new FollowService();