// services/PersonaService.js
const PersonaRepository = require('../repositories/PersonaRepository');
const PersonaFactory = require('../factories/PersonaFactory');
const Persona = require('../models/Persona');

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

    const updatePayload = { estado };

    if (estado === 'Restringido') {
      // Bloqueo temporal por 3 días
      const tresDias = 3 * 24 * 60 * 60 * 1000;
      updatePayload.restrictedUntil = new Date(Date.now() + tresDias);
    } else {
      // Para otros estados, limpiar la restricción temporal
      updatePayload.restrictedUntil = null;
    }
    
    const personaActualizada = await PersonaRepository.update(id, updatePayload);
    if (!personaActualizada) {
      throw new Error('Persona no encontrada');
    }
    return personaActualizada;
  }

  /** HISTORIAL (visto/escuchado) */
  async agregarHistorial(personaId, { contenido_id, tipo }) {
    try {
      if (!contenido_id || !tipo) {
        throw new Error('Se requieren contenido_id y tipo');
      }

      const persona = await Persona.findById(personaId);
      if (!persona) {
        throw new Error('Persona no encontrada');
      }

      // Verificar si ya existe en el historial
      const existeEnHistorial = persona.historial.some(
        item => item.contenido_id === contenido_id && item.tipo === tipo
      );

      if (existeEnHistorial) {
        return persona;
      }

      persona.historial.push({ contenido_id, tipo });
      await persona.save();
      return persona;
    } catch (error) {
      throw new Error(`Error al agregar al historial: ${error.message}`);
    }
  }

  async quitarHistorial(personaId, { contenido_id, tipo }) {
    try {
      if (!contenido_id || !tipo) {
        throw new Error('Se requieren contenido_id y tipo');
      }

      const persona = await Persona.findById(personaId);
      if (!persona) {
        throw new Error('Persona no encontrada');
      }

      persona.historial = persona.historial.filter(
        item => !(item.contenido_id === contenido_id && item.tipo === tipo)
      );
      await persona.save();
      return persona;
    } catch (error) {
      throw new Error(`Error al quitar del historial: ${error.message}`);
    }
  }

  async obtenerHistorial(personaId) {
    try {
      const persona = await Persona.findById(personaId);
      if (!persona) {
        throw new Error('Persona no encontrada');
      }
      return persona.historial || [];
    } catch (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }

  /** ME GUSTA */
  async agregarMeGusta(personaId, { contenido_id, tipo }) {
    try {
      if (!contenido_id || !tipo) {
        throw new Error('Se requieren contenido_id y tipo');
      }

      const persona = await Persona.findById(personaId);
      if (!persona) {
        throw new Error('Persona no encontrada');
      }

      // Verificar si ya existe en me gusta
      const existeEnMeGusta = persona.meGusta.some(
        item => item.contenido_id === contenido_id && item.tipo === tipo
      );

      if (existeEnMeGusta) {
        return persona;
      }

      persona.meGusta.push({ contenido_id, tipo });
      await persona.save();
      return persona;
    } catch (error) {
      throw new Error(`Error al agregar me gusta: ${error.message}`);
    }
  }

  async quitarMeGusta(personaId, { contenido_id, tipo }) {
    try {
      if (!contenido_id || !tipo) {
        throw new Error('Se requieren contenido_id y tipo');
      }

      const persona = await Persona.findById(personaId);
      if (!persona) {
        throw new Error('Persona no encontrada');
      }

      persona.meGusta = persona.meGusta.filter(
        item => !(item.contenido_id === contenido_id && item.tipo === tipo)
      );
      await persona.save();
      return persona;
    } catch (error) {
      throw new Error(`Error al quitar me gusta: ${error.message}`);
    }
  }

  async obtenerMeGusta(personaId) {
    try {
      const persona = await Persona.findById(personaId);
      if (!persona) {
        throw new Error('Persona no encontrada');
      }
      return persona.meGusta || [];
    } catch (error) {
      throw new Error(`Error al obtener me gusta: ${error.message}`);
    }
  }
}

module.exports = new PersonaService();
