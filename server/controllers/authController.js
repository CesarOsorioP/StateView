// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Persona = require('../models/Persona');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Función para registrar un usuario
async function signUp(req, res) {
  try {
    const { nombre, email, contraseña, imagenPerfil } = req.body;
    const usuarioExistente = await Persona.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }
    const saltRounds = 10;
    const contraseñaHasheada = await bcrypt.hash(contraseña, saltRounds);
    const nuevaPersona = new Persona({
      nombre,
      email,
      contraseña: contraseñaHasheada,
      imagenPerfil,
      rol: 'Usuario'
    });
    await nuevaPersona.save();
    res.status(201).json({ message: 'Usuario registrado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Función para iniciar sesión
async function login(req, res) {
  try {
    const { email, contraseña } = req.body;
    const persona = await Persona.findOne({ email });
    if (!persona) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const coincide = await bcrypt.compare(contraseña, persona.contraseña);
    if (!coincide) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const payload = {
      id: persona._id,
      email: persona.email,
      rol: persona.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Retornamos el id junto con el resto de los datos
    res.status(200).json({
      token,
      tipoUsuario: persona.rol,
      nombre: persona.nombre,
      id: persona._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Nueva función para obtener los datos del usuario actual
async function getCurrentUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No se proporcionó token' });
    }
    const token = authHeader.split(' ')[1]; // Se asume "Bearer <token>"
    const decoded = jwt.verify(token, JWT_SECRET);
    // Busca al usuario excluyendo la contraseña
    const user = await Persona.findById(decoded.id).select('-contraseña');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { signUp, login, getCurrentUser };
