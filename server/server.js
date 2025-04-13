const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos
const DB_URL = 'mongodb://localhost:27017/tu_base_de_datos'; // Ajusta la URL según tu configuración
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Rutas
app.get('/', (req, res) => {
    res.send('¡Backend Express está funcionando!');
});

// Puerto
const PORT = 5000; // Cambia el puerto si es necesario
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
