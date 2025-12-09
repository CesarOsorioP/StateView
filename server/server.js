// server.js
require('dotenv').config(); // Carga tus variables de entorno
const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const { configureSocketServer } = require('./controllers/socketController');

// Importar modelos
require('./models');

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
const followRoutes = require('./routes/followRoutes');
const userProfileRoutes = require('./routes/userProfile');
const listaRoutes = require('./routes/listaRoutes');
const contenidoRoutes = require('./routes/contenidoRoutes');
const userContentRoutes = require('./routes/userContentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const insigniaRoutes = require('./routes/insigniaRoutes');
const contentRoutes = require('./routes/contentRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');

const app = express();

// ✅ CORS: permite tanto localhost como Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'https://state-view.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

// Conecta a MongoDB Atlas
connectDB();

// Inicializar Redis (no bloqueante)
const { getRedisClient, cache } = require('./config/redis');
getRedisClient()
  .then(async (client) => {
    if (client) {
      // Test de conexión usando la función helper
      try {
        const testKey = 'test:connection:' + Date.now();
        const testValue = { status: 'ok', timestamp: Date.now() };
        
        // Usar la función helper cache.set en lugar de client.setEx directamente
        const saved = await cache.set(testKey, testValue, 10);
        if (saved) {
          const test = await cache.get(testKey);
          console.log('✅ Redis test exitoso:', test ? 'Datos guardados y recuperados correctamente' : 'Error al recuperar');
        } else {
          console.warn('⚠️  Redis test: No se pudo guardar el test');
        }
        
        // Listar algunas claves para verificar
        try {
          const keys = await client.keys('*');
          console.log(`📊 Total de claves en Redis: ${keys.length}`);
          if (keys.length > 0) {
            console.log('📋 Primeras 5 claves:', keys.slice(0, 5));
          }
        } catch (keysError) {
          console.warn('⚠️  No se pudieron listar las claves:', keysError.message);
        }
      } catch (err) {
        console.error('❌ Redis test falló:', err.message);
        console.error('❌ Redis test stack:', err.stack);
      }
    } else {
      console.warn('⚠️  Redis client es null');
    }
  })
  .catch(err => {
    console.warn('Redis no disponible, la aplicación continuará sin caché:', err.message);
    console.error('Redis error stack:', err.stack);
  });

// Middleware para parsear JSON y archivos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/persona', personaRoutes);
app.use('/api/pelicula', peliculaRoutes);
app.use('/api/serie', serieRoutes);
app.use('/api/videojuego', videojuegoRoutes);
app.use('/api/album', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/moderador', moderadorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/critico', criticoRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/listas', listaRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/user-content', userContentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/insignias', insigniaRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/notificaciones', notificacionRoutes);

app.get('/', (req, res) => {
  res.send('Backend Express funcionando');
});

if (require.main === module) {
  const server = http.createServer(app);

  // Configurar Socket.IO
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  configureSocketServer(io);

  // Middleware para disponer de "io" en todas las peticiones
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

module.exports = app;
