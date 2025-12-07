const mongoose = require('mongoose');

// Importar todos los modelos
require('./Persona');
require('./Pelicula');
require('./Serie');
require('./Videojuego');
require('./Album');
require('./Lista');
require('./Notificacion');

// Exportar mongoose para uso en otros archivos
module.exports = mongoose; 