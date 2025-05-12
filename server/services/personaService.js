// services/PersonaService.js
const PersonaRepository = require('../repositories/PersonaRepository');
const PersonaFactory = require('../factories/PersonaFactory');

class PersonaService {
  /**
   * Crea una nueva Persona.
   * Verifica la existencia del email, utiliza el factory para crear y el repositorio para guardar.
   * @param {Object} data - Datos de creación.
   * @returns {Promise<Persona>}
   */
  async crearPersona(data) {
    // Verificar si el email ya existe
    const personaExistente = await PersonaRepository.findOne({ email: data.email });
    if (personaExistente) {
      throw new Error('El email ya está registrado.');
    }
    
    // Utiliza el factory para crear la instancia de Persona
    const nuevaPersonaInstance = await PersonaFactory.create(data);
    
    // Guarda la nueva Persona a través del repositorio
    return await PersonaRepository.create(nuevaPersonaInstance);
  }

  /**
   * Obtiene todas las Personas.
   * @returns {Promise<Array>}
   */
  async obtenerPersonas() {
    return await PersonaRepository.findAll();
  }

  /**
   * Obtiene una Persona por su ID.
   * @param {string} id - ID de la Persona.
   * @returns {Promise<Persona>}
   */
  async obtenerPersonaPorId(id) {
    const persona = await PersonaRepository.findById(id);
    if (!persona) {
      throw new Error('Persona no encontrada');
    }
    return persona;
  }

  /**
   * Edita o actualiza una Persona.
   * Prepara los datos (como el hash de la contraseña) y actualiza la entidad.
   * @param {string} id - ID de la Persona.
   * @param {Object} data - Datos de actualización.
   * @returns {Promise<Persona>}
   */
  async editarPersona(id, data) {
    const updateData = await PersonaFactory.prepareForUpdate(data);
    const personaActualizada = await PersonaRepository.update(id, updateData);
    if (!personaActualizada) {
      throw new Error('Persona no encontrada');
    }
    return personaActualizada;
  }

  /**
   * Actualiza el estado de una Persona.
   * @param {string} id - ID de la Persona.
   * @param {string} estado - Nuevo estado.
   * @returns {Promise<Persona>}
   */
  async actualizarEstadoPersona(id, estado) {
    const estadosPermitidos = ['Activo', 'Restringido', 'Advertido', 'Desactivado'];
    if (!estado || !estadosPermitidos.includes(estado)) {
      throw new Error(`Estado no válido. Debe ser uno de: ${estadosPermitidos.join(', ')}`);
    }
    
    const personaActualizada = await PersonaRepository.update(id, { estado });
    if (!personaActualizada) {
      throw new Error('Persona no encontrada');
    }
    return personaActualizada;
  }
}

module.exports = new PersonaService();
