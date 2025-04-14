// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Persona = require('../models/Persona');

// Lee las variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Registra un nuevo usuario.
 * Se espera recibir en el body: nombre, email, contraseña (y opcionalmente imagenPerfil u otros).
 */
async function signUp(req, res) {
  try {
    const { nombre, email, contraseña, imagenPerfil } = req.body;

    // Verificar que no exista un usuario con el mismo email.
    const usuarioExistente = await Persona.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    // Hashear la contraseña
    const saltRounds = 10;
    const contraseñaHasheada = await bcrypt.hash(contraseña, saltRounds);

    // Crear un nuevo objeto de Persona.
    const nuevaPersona = new Persona({
      nombre,
      email,
      contraseña: contraseñaHasheada,
      imagenPerfil,
      rol: 'Usuario' // Asigna el rol por defecto. Se puede cambiar según necesidades.
    });

    await nuevaPersona.save();
    res.status(201).json({ message: 'Usuario registrado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Inicia sesión a un usuario registrado.
 * Se espera recibir en el body: email y contraseña.
 */
async function login(req, res) {
  try {
    const { email, contraseña } = req.body;
    const persona = await Persona.findOne({ email });
    if (!persona) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // Comparar la contraseña proporcionada con la hasheada en la DB.
    const coincide = await bcrypt.compare(contraseña, persona.contraseña);
    if (!coincide) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // Crear el payload del token JWT.
    const payload = {
      id: persona._id,
      email: persona.email,
      rol: persona.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  signUp,
  login
};
