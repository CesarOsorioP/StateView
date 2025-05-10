// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Persona = require('../models/Persona');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Configurar el transporte de nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true para puerto 465, false para otros puertos
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

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

    // Genera el token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    console.log("Token generado:", token); // Log para verificar el token

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

// Función para solicitar restablecimiento de contraseña
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    
    // Buscar al usuario por email
    const usuario = await Persona.findOne({ email });
    if (!usuario) {
      // Por seguridad, no revelamos si el email existe o no
      return res.status(200).json({ 
        message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' 
      });
    }
    
    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Guardar token con tiempo de expiración (1 hora)
    usuario.resetPasswordToken = resetToken;
    usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora en milisegundos
    await usuario.save();
    
    // Crear URL para restablecer contraseña
    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;
    
    // Enviar email
    const mailOptions = {
      from: `"StateView" <${EMAIL_USER}>`,
      to: usuario.email,
      subject: 'Restablecimiento de contraseña - StateView',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #3498db; text-align: center;">StateView</h2>
          <h3>Restablecimiento de contraseña</h3>
          <p>Hola ${usuario.nombre},</p>
          <p>Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer Contraseña</a>
          </div>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #777; font-size: 12px; text-align: center;">© 2025 StateView - Todos los derechos reservados</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' 
    });
  } catch (error) {
    console.error('Error al solicitar restablecimiento:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}

// Función para validar token de restablecimiento
async function validateResetToken(req, res) {
  try {
    const { token } = req.params;
    
    const usuario = await Persona.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!usuario) {
      return res.status(400).json({ error: 'El token es inválido o ha expirado' });
    }
    
    res.status(200).json({ message: 'Token válido', email: usuario.email });
  } catch (error) {
    res.status(500).json({ error: 'Error al validar el token' });
  }
}

// Función para restablecer la contraseña
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { contraseña } = req.body;
    
    const usuario = await Persona.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!usuario) {
      return res.status(400).json({ error: 'El token es inválido o ha expirado' });
    }
    
    // Hashear la nueva contraseña
    const saltRounds = 10;
    const contraseñaHasheada = await bcrypt.hash(contraseña, saltRounds);
    
    // Actualizar contraseña y limpiar tokens
    usuario.contraseña = contraseñaHasheada;
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    
    await usuario.save();
    
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
}

module.exports = { 
  signUp, 
  login, 
  getCurrentUser, 
  requestPasswordReset, 
  validateResetToken, 
  resetPassword 
};