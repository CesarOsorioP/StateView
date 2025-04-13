// server.js
require('dotenv').config(); // Carga tus variables de entorno
const express = require('express');
const connectDB = require('./config/db');
const personaRoutes = require('./routes/personaRoutes');

const app = express();

// Conecta a MongoDB Atlas
connectDB();

// Middleware para parsear JSON
app.use(express.json());

// Ruta para la API de Personas (ruta base: /api/personas)
app.use('/api/persona', personaRoutes);

// Ruta de ejemplo para verificar que el servidor esté corriendo
app.get('/', (req, res) => {
  res.send('Backend Express funcionando');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
