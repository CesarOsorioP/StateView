// repositories/PersonaRepository.js
const Persona = require('../models/Persona');
const mongoose = require('mongoose');

class PersonaRepository {
  /**
   * Crea y guarda una nueva Persona en la base de datos.
   * @param {Object|Persona} personaData - Datos de la persona o instancia de Persona.
   * @returns {Promise<Persona>} Documento de Persona guardado.
   */
  async create(personaData) {
    const persona = personaData instanceof Persona ? personaData : new Persona(personaData);
    return await persona.save();
  }

  /**
   * Encuentra una Persona por una consulta personalizada.
   *
   * @param {Object} query - Consulta para filtrar.
   * @returns {Promise<Persona|null>} Documento de Persona encontrado o null.
   */
  async findOne(query) {
    return await Persona.findOne(query);
  }

  /**
   * Obtiene todas las Personas.
   *
   * @returns {Promise<Array<Persona>>} Lista de Personas.
   */
  async findAll() {
    return await Persona.find();
  }

  /**
   * Encuentra una Persona por su ID.
   *
   * @param {String} personaId - ID de la Persona.
   * @returns {Promise<Persona|null>} Documento de Persona encontrado o null.
   */
  async findById(personaId) {
    return await Persona.findById(personaId);
  }

  /**
   * Busca una Persona por su email.
   *
   * @param {String} email - Email de la Persona.
   * @returns {Promise<Persona|null>} Documento de Persona encontrado o null.
   */
  async findByEmail(email) {
    return await Persona.findOne({ email });
  }

  /**
   * Guarda cambios en una instancia de Persona.
   *
   * @param {Persona} persona - Instancia de Persona a guardar.
   * @returns {Promise<Persona>} Documento de Persona guardado.
   */
  async save(persona) {
    return await persona.save();
  }

  /**
   * Actualiza una Persona en la base de datos.
   *
   * @param {String} personaId - ID de la Persona a actualizar.
   * @param {Object} updateData - Datos a actualizar.
   * @returns {Promise<Persona|null>} Documento de Persona actualizado o null.
   */
  async update(personaId, updateData) {
    return await Persona.findByIdAndUpdate(
      personaId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Agrega un seguidor a una Persona.
   *
   * @param {String} personaId - ID de la Persona a la que se agrega un seguidor.
   * @param {Object} seguidor - Objeto con los datos del seguidor.
   * @returns {Promise<Persona|null>} Documento de Persona actualizado o null.
   */
  async addSeguidor(personaId, seguidor) {
    return await Persona.findByIdAndUpdate(
      personaId,
      { $addToSet: { seguidores: seguidor } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Elimina un seguidor de una Persona.
   *
   * @param {String} personaId - ID de la Persona de la que se elimina un seguidor.
   * @param {String} seguidorId - ID del seguidor a eliminar.
   * @returns {Promise<Persona|null>} Documento de Persona actualizado o null.
   */
  async removeSeguidor(personaId, seguidorId) {
    return await Persona.findByIdAndUpdate(
      personaId,
      { $pull: { seguidores: { id_seguidor: seguidorId } } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Agrega una persona seguida a la lista de siguiendo.
   *
   * @param {String} personaId - ID de la Persona que sigue.
   * @param {Object} siguiendo - Objeto con los datos de la Persona seguida.
   * @returns {Promise<Persona|null>} Documento de Persona actualizado o null.
   */
  async addSiguiendo(personaId, siguiendo) {
    return await Persona.findByIdAndUpdate(
      personaId,
      { $addToSet: { siguiendo: siguiendo } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Elimina una persona seguida de la lista de siguiendo.
   *
   * @param {String} personaId - ID de la Persona que deja de seguir.
   * @param {String} seguidoId - ID de la Persona que deja de ser seguida.
   * @returns {Promise<Persona|null>} Documento de Persona actualizado o null.
   */
  async removeSiguiendo(personaId, seguidoId) {
    return await Persona.findByIdAndUpdate(
      personaId,
      { $pull: { siguiendo: { id_persona_seguida: seguidoId } } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Obtiene la lista de seguidores de una Persona.
   *
   * @param {String} personaId - ID de la Persona.
   * @returns {Promise<Array>} Lista de seguidores.
   */
  async getSeguidores(personaId) {
    const persona = await Persona.findById(personaId).select('seguidores');
    return persona ? persona.seguidores : [];
  }

  /**
   * Obtiene la lista de personas a las que sigue una Persona.
   *
   * @param {String} personaId - ID de la Persona.
   * @returns {Promise<Array>} Lista de personas seguidas.
   */
  async getSiguiendo(personaId) {
    const persona = await Persona.findById(personaId).select('siguiendo');
    return persona ? persona.siguiendo : [];
  }

  /**
   * Verifica si una Persona (seguidor) sigue a otra (seguido).
   *
   * @param {String} seguidorId - ID del seguidor.
   * @param {String} seguidoId - ID del seguido.
   * @returns {Promise<Boolean>} true si sigue, false en caso contrario.
   */
  async isFollowing(seguidorId, seguidoId) {
    const persona = await Persona.findOne({
      _id: seguidorId,
      'siguiendo.id_persona_seguida': seguidoId
    });
    return !!persona;
  }
}

module.exports = new PersonaRepository();
