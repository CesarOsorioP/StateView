// factories/PersonaFactory.js
const bcrypt = require('bcrypt');
const Persona = require('../models/Persona');

class PersonaFactory {
  /**
   * Crea una nueva instancia de Persona.
   * Se encarga de hashear la contraseña y asignar valores por defecto.
   * 
   * @param {Object} data - Datos de creación.
   * @param {string} data.nombre
   * @param {string} data.email
   * @param {string} data.contraseña
   * @param {string} [data.imagenPerfil]
   * @param {string} [data.rol]
   * @returns {Promise<Persona>} Instancia de Persona lista para persistir.
   */
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
