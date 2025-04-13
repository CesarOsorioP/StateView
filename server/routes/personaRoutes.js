// routes/personaRoutes.js
const express = require('express');
const router = express.Router();
const Persona = require('../models/Persona');

// Endpoint para insertar una nueva Persona
router.post('/', async (req, res) => {
  try {
    const nuevaPersona = new Persona(req.body); // Asegúrate de enviar un JSON con los campos requeridos: nombre, email y password al menos.
    const savedPersona = await nuevaPersona.save();
    res.status(201).json(savedPersona);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para obtener todas las Personas
router.get('/', async (req, res) => {
  try {
    const personas = await Persona.find();
    res.json(personas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
