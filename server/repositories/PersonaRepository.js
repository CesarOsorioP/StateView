// repositories/PersonaRepository.js
const Persona = require('../models/Persona');

class PersonaRepository {
  /**
   * Crea y guarda una nueva Persona en la base de datos.
   * @param {Object} personaData - Instancia de Persona (o datos listos).
   * @returns {Promise<Persona>}
   */
  async create(personaData) {
    // Aquí se admite que personaData puede ser una instancia de Persona.
    const persona = personaData instanceof Persona ? personaData : new Persona(personaData);
    return await persona.save();
  }

  /**
   * Encuentra una Persona por consulta.
   * @param {Object} query - Consulta para filtrar.
   * @returns {Promise<Persona>}
   */
  async findOne(query) {
    return await Persona.findOne(query);
  }

  /**
   * Obtiene todas las Personas.
   * @returns {Promise<Array<Persona>>}
   */
  async findAll() {
    return await Persona.find();
  }

  /**
   * Busca una Persona por ID.
   * @param {string} id - El ID de la Persona.
   * @returns {Promise<Persona>}
   */
  async findById(id) {
    return await Persona.findById(id);
  }

  /**
   * Actualiza una Persona por ID.
   * @param {string} id - ID de la Persona.
   * @param {Object} updateData - Datos de actualización.
   * @returns {Promise<Persona>}
   */
  async update(id, updateData) {
    return await Persona.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new PersonaRepository();
