// server.js
require('dotenv').config(); // Carga tus variables de entorno
const cors = require('cors'); // Importa el paquete cors
const express = require('express');
const connectDB = require('./config/db');
const personaRoutes = require('./routes/personaRoutes');
const peliculaRoutes = require('./routes/peliculaRoutes');
const serieRoutes = require('./routes/serieRoutes')
const videojuegoRoutes = require('./routes/videojuegoRoutes');
const albumRoutes = require('./routes/albumRoutes');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const commentRoutes = require('./routes/commentRoutes');


const app = express();

// Configura Cors para permitir solicitudes desde http://localhost:3000
app.use(cors({
    origin: "http://localhost:3000",
  }));

// Conecta a MongoDB Atlas
connectDB();

// Middleware para parsear JSON
app.use(express.json());

// Ruta para la API de Personas (ruta base: /api/personas)
app.use('/api/persona', personaRoutes);
app.use('/api/peliculas', peliculaRoutes);
app.use('/api/series' , serieRoutes);
app.use('/api/videojuegos', videojuegoRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
  res.send('Backend Express funcionando');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
