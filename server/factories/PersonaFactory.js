// factories/PersonaFactory.js
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Persona = require('../models/Persona');

class PersonaFactory {

  static async create({ nombre, email, contraseña, imagenPerfil, rol }) {
    const saltRounds = 10;
    const contraseñaHasheada = await bcrypt.hash(contraseña, saltRounds);

    return new Persona({
      nombre,
      email,
      contraseña: contraseñaHasheada,
      imagenPerfil: imagenPerfil || '',
      rol: rol || 'Usuario',
    });
  }

  /**
   * Crea una instancia de Persona sin hashear la contraseña.
   *
   * @param {Object} data - Datos de creación.
   * @returns {Persona} Instancia de Persona lista para guardar.
   */
  static createWithoutHashing(data) {
    const personaData = {
      nombre: data.nombre,
      email: data.email,
      contraseña: data.contraseña,
      rol: data.rol || 'Usuario',
      imagenPerfil: data.imagenPerfil,
      imagenBanner: data.imagenBanner,
      estado: data.estado || 'Activo'
    };
    return new Persona(personaData);
  }

  /**
   * Crea un objeto seguidor para agregar a la lista de seguidores.
   * @param {string|Object} seguidorId - ID del seguidor o documento de Persona.
   * @param {string} nombreSeguidor - Nombre del seguidor.
   * @returns {Object} Objeto seguidor listo para agregar al array.
   */
  static createSeguidor(seguidorId, nombreSeguidor) {
    const id = seguidorId instanceof mongoose.Types.ObjectId
      ? seguidorId.toString()
      : seguidorId._id
        ? seguidorId._id.toString()
        : seguidorId.toString();

    return {
      id_seguidor: id,
      nombre_seguidor: nombreSeguidor
    };
  }

  /**
   * Crea un objeto siguiendo para agregar a la lista de seguidos.
   * @param {string|Object} seguidoId - ID del seguido o documento de Persona.
   * @param {string} nombreSeguido - Nombre del seguido.
   * @returns {Object} Objeto siguiendo listo para agregar al array.
   */
  static createSiguiendo(seguidoId, nombreSeguido) {
    const id = seguidoId instanceof mongoose.Types.ObjectId
      ? seguidoId.toString()
      : seguidoId._id
        ? seguidoId._id.toString()
        : seguidoId.toString();

    return {
      id_persona_seguida: id,
      nombre_persona_seguida: nombreSeguido
    };
  }

  /**
   * Prepara los datos para actualizar una Persona.
   * Si se incluye una nueva contraseña, la hashea.
   * 
   * @param {Object} data - Datos de actualización.
   * @returns {Promise<Object>} Datos listos para actualizar.
   */
  static async prepareForUpdate(data) {
    const updateData = { ...data };

    if (updateData.contraseña) {
      const saltRounds = 10;
      updateData.contraseña = await bcrypt.hash(updateData.contraseña, saltRounds);
    }

    return updateData;
  }
}

module.exports = PersonaFactory;
