const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importar modelos
const Review = require('../models/Review');
const Persona = require('../models/Persona');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Videojuego = require('../models/Videojuego');
const Album = require('../models/Album');

// Configuración de conexión a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stateview');
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const syncReviews = async () => {
  try {
    await connectDB();
    console.log('Iniciando sincronización de reseñas...');

    // 1. Obtener todos los IDs de reseñas válidas
    const allReviews = await Review.find({}, '_id');
    const validReviewIds = new Set(allReviews.map(r => r._id.toString()));
    console.log(`Total reseñas válidas en colección Reviews: ${validReviewIds.size}`);

    // 2. Limpiar reseñas en Personas (Usuarios)
    console.log('Limpiando usuarios...');
    const personas = await Persona.find({});
    let personasModificadas = 0;

    for (const persona of personas) {
      if (persona.reviews && persona.reviews.length > 0) {
        const originalCount = persona.reviews.length;
        // Filtramos: nos quedamos solo con las que existen en validReviewIds
        const validReviews = persona.reviews.filter(r => 
          r.reviewId && validReviewIds.has(r.reviewId.toString())
        );

        if (validReviews.length !== originalCount) {
          persona.reviews = validReviews;
          await persona.save();
          personasModificadas++;
          console.log(`Usuario ${persona.nombre}: eliminadas ${originalCount - validReviews.length} reseñas huérfanas.`);
        }
      }
    }
    console.log(`Usuarios sincronizados. Modificados: ${personasModificadas}`);

    // 3. Función genérica para limpiar items (Pelicula, Serie, etc.)
    const cleanItemReviews = async (Model, modelName) => {
      console.log(`Limpiando ${modelName}...`);
      const items = await Model.find({});
      let itemsModificados = 0;

      for (const item of items) {
        if (item.reviews && item.reviews.length > 0) {
          const originalCount = item.reviews.length;
          // Filtramos reseñas huérfanas
          const validReviews = item.reviews.filter(r => 
            r.reviewId && validReviewIds.has(r.reviewId.toString())
          );

          if (validReviews.length !== originalCount) {
            item.reviews = validReviews;
            
            // Recalcular estadísticas
            item.ratingCount = validReviews.length;
            if (item.ratingCount > 0) {
              const totalRating = validReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
              item.totalRating = totalRating;
              item.averageRating = totalRating / item.ratingCount;
            } else {
              item.totalRating = 0;
              item.averageRating = 0;
            }

            await item.save();
            itemsModificados++;
            console.log(`${modelName} "${item.titulo || item.nombre}": eliminadas ${originalCount - validReviews.length} reseñas huérfanas. Nuevo rating: ${item.averageRating.toFixed(1)}`);
          }
        }
      }
      console.log(`${modelName} sincronizados. Modificados: ${itemsModificados}`);
    };

    // Ejecutar limpieza para cada tipo de contenido
    await cleanItemReviews(Pelicula, 'Películas');
    await cleanItemReviews(Serie, 'Series');
    await cleanItemReviews(Videojuego, 'Videojuegos');
    await cleanItemReviews(Album, 'Álbumes');

    console.log('Sincronización completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la sincronización:', error);
    process.exit(1);
  }
};

syncReviews();

