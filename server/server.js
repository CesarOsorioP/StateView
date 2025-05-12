require('dotenv').config(); // Carga tus variables de entorno
const cors = require('cors'); // Importa el paquete cors
const express = require('express');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const { configureSocketServer } = require('./controllers/socketController');

// Importación de rutas
const personaRoutes = require('./routes/personaRoutes');
const peliculaRoutes = require('./routes/peliculaRoutes');
const serieRoutes = require('./routes/serieRoutes');
const videojuegoRoutes = require('./routes/videojuegoRoutes');
const albumRoutes = require('./routes/albumRoutes');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const commentRoutes = require('./routes/commentRoutes');
const moderadorRoutes = require('./routes/moderadorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const criticoRoutes = require('./routes/criticoRoutes');
const itemRoutes = require('./routes/itemRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// ✅ CORS: permite tanto localhost como Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'https://state-view.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite solicitudes sin origin (por ejemplo, herramientas como Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true // si usas cookies o sesiones
}));

// Conecta a MongoDB Atlas
connectDB();

// Middleware para parsear JSON
app.use(express.json());

// Crea el servidor HTTP a partir de la aplicación Express
const server = http.createServer(app);

// Configura Socket.IO una sola vez con el servidor HTTP
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Usa la misma configuración de CORS
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configura los sockets utilizando el controlador
configureSocketServer(io);

// Middleware para disponer de "io" en todas las peticiones
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/persona', personaRoutes);
app.use('/api/peliculas', peliculaRoutes);
app.use('/api/series', serieRoutes);
app.use('/api/videojuegos', videojuegoRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/moderador', moderadorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/critico', criticoRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/reportes', reportRoutes);

app.get('/', (req, res) => {
  res.send('Backend Express funcionando');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});