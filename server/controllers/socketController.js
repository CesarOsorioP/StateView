const Persona = require('../models/Persona');
const Review = require('../models/Review');
const Pelicula = require('../models/Pelicula');
const Serie = require('../models/Serie');
const Videojuego = require('../models/Videojuego');
const Album = require('../models/Album');

/**
 * Configura los sockets para el dashboard de la aplicación
 * @param {Server} io - Instancia del servidor Socket.io
 */
const configureSocketServer = (io) => {
  // Namespace para el dashboard de usuarios
  const dashboardUsers = io.of('/dashboard/users');
  
  dashboardUsers.on('connection', async (socket) => {
    console.log('Cliente conectado al dashboard de usuarios');
    
    // Enviar estadísticas iniciales
    await sendUserStats(socket);
    await sendContentStats(socket);
    await sendUserActivity(socket);
    
    // Configurar intervalo para actualizar estadísticas
    const userStatsInterval = setInterval(async () => {
      await sendUserStats(socket);
    }, 3000); // Cada 10 segundos
    
    const contentStatsInterval = setInterval(async () => {
      await sendContentStats(socket);
    }, 3000); // Cada 15 segundos
    
    const activityInterval = setInterval(async () => {
      await sendUserActivity(socket);
    }, 3000); // Cada 20 segundos
    
    // Limpiar intervalos al desconectar
    socket.on('disconnect', () => {
      console.log('Cliente desconectado del dashboard de usuarios');
      clearInterval(userStatsInterval);
      clearInterval(contentStatsInterval);
      clearInterval(activityInterval);
    });
  });
  
  // Namespace para el dashboard de contenido
  const dashboardContent = io.of('/dashboard/content');
  
  dashboardContent.on('connection', async (socket) => {
    console.log('Cliente conectado al dashboard de contenido');
    
    // Implementación futura: estadísticas específicas para el dashboard de contenido
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado del dashboard de contenido');
    });
  });
};

/**
 * Envía estadísticas de usuarios al cliente conectado
 * @param {Socket} socket - Socket del cliente
 */
async function sendUserStats(socket) {
  try {
    // Consulta de agregación para contar usuarios por estado
    const statsArray = await Persona.aggregate([
      { $group: { _id: "$estado", count: { $sum: 1 } } }
    ]);
    
    const statsObj = {};
    statsArray.forEach(item => {
      statsObj[item._id || 'Activo'] = item.count;
    });
    
    // Enviar estadísticas de usuarios
    socket.emit("userStats", statsObj);
  } catch (error) {
    console.error("Error al obtener estadísticas de usuarios:", error);
  }
}

/**
 * Envía estadísticas de contenido al cliente conectado
 * @param {Socket} socket - Socket del cliente
 */
async function sendContentStats(socket) {
  try {
    // 1. Cantidad de reseñas por tipo de contenido
    const reviewStats = await Review.aggregate([
      { $group: { _id: "$onModel", count: { $sum: 1 } } }
    ]);
    
    const reviewsObj = {
      Pelicula: 0,
      Serie: 0,
      Videojuego: 0,
      Album: 0
    };
    
    reviewStats.forEach(item => {
      if (item._id) {
        reviewsObj[item._id] = item.count;
      }
    });
    
    // 2. Cantidad de contenido por tipo
    const contentCount = {
      Pelicula: await Pelicula.countDocuments(),
      Serie: await Serie.countDocuments(),
      Videojuego: await Videojuego.countDocuments(),
      Album: await Album.countDocuments()
    };
    
    // 3. Calificaciones promedio por tipo de contenido
    const avgRatings = {
      Pelicula: 0,
      Serie: 0,
      Videojuego: 0,
      Album: 0
    };

    // Calificación promedio usando el campo rating en lugar de averageRating
    // Películas promedio
    const peliculaAvg = await Review.aggregate([
      { $match: { onModel: 'Pelicula', rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    if (peliculaAvg.length > 0 && peliculaAvg[0].avg) {
      avgRatings.Pelicula = parseFloat(peliculaAvg[0].avg.toFixed(1));
    }
    
    // Series promedio
    const serieAvg = await Review.aggregate([
      { $match: { onModel: 'Serie', rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    if (serieAvg.length > 0 && serieAvg[0].avg) {
      avgRatings.Serie = parseFloat(serieAvg[0].avg.toFixed(1));
    }
    
    // Videojuegos promedio
    const videojuegoAvg = await Review.aggregate([
      { $match: { onModel: 'Videojuego', rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    if (videojuegoAvg.length > 0 && videojuegoAvg[0].avg) {
      avgRatings.Videojuego = parseFloat(videojuegoAvg[0].avg.toFixed(1));
    }
    
    // Álbumes promedio
    const albumAvg = await Review.aggregate([
      { $match: { onModel: 'Album', rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    if (albumAvg.length > 0 && albumAvg[0].avg) {
      avgRatings.Album = parseFloat(albumAvg[0].avg.toFixed(1));
    }
    
    // Compilar y enviar estadísticas de contenido
    const contentStats = {
      reviews: reviewsObj,
      contentCount: contentCount,
      avgRatings: avgRatings,
      userActivity: [] // Se llena en la función sendUserActivity
    };
    
    socket.emit("contentStats", contentStats);
  } catch (error) {
    console.error("Error al obtener estadísticas de contenido:", error);
  }
}

/**
 * Envía datos de actividad de usuarios en los últimos 7 días
 * @param {Socket} socket - Socket del cliente
 */
async function sendUserActivity(socket) {
  try {
    // Obtener fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 para incluir el día actual (total 7 días)
    sevenDaysAgo.setHours(0, 0, 0, 0); // Inicio del día
    
    // Agregar actividad de usuarios por día (reseñas)
    const reviewActivity = await Review.aggregate([
      { 
        $match: { 
          fechaReview: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$fechaReview" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // Crear array con 7 posiciones (una por día)
    const activityData = Array(7).fill(0);
    
    // Llenar array con datos de actividad
    reviewActivity.forEach(dayData => {
      const dayDate = new Date(dayData._id);
      const dayIndex = Math.floor((dayDate - sevenDaysAgo) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        activityData[dayIndex] = dayData.count;
      }
    });
    
    // Obtener estadísticas actuales para no sobreescribir otros campos
    const currentStats = await getCurrentContentStats();
    
    // Actualizar actividad de usuarios y enviar
    currentStats.userActivity = activityData;
    socket.emit("contentStats", currentStats);
    
  } catch (error) {
    console.error("Error al obtener actividad de usuarios:", error);
  }
}

/**
 * Obtiene las estadísticas actuales de contenido
 * @returns {Object} Estadísticas de contenido
 */
async function getCurrentContentStats() {
  try {
    // Estructura básica de las estadísticas
    const stats = {
      reviews: {
        Pelicula: 0,
        Serie: 0,
        Videojuego: 0,
        Album: 0
      },
      contentCount: {
        Pelicula: 0,
        Serie: 0,
        Videojuego: 0,
        Album: 0
      },
      avgRatings: {
        Pelicula: 0,
        Serie: 0,
        Videojuego: 0,
        Album: 0
      },
      userActivity: Array(7).fill(0)
    };
    
    // Obtener conteo de reseñas
    const reviewCounts = await Review.aggregate([
      { $group: { _id: "$onModel", count: { $sum: 1 } } }
    ]);
    
    reviewCounts.forEach(item => {
      if (item._id && stats.reviews.hasOwnProperty(item._id)) {
        stats.reviews[item._id] = item.count;
      }
    });
    
    // Obtener conteo de contenido
    stats.contentCount.Pelicula = await Pelicula.countDocuments();
    stats.contentCount.Serie = await Serie.countDocuments();
    stats.contentCount.Videojuego = await Videojuego.countDocuments();
    stats.contentCount.Album = await Album.countDocuments();
    
    // Obtener calificaciones promedio desde las reseñas
    const models = ['Pelicula', 'Serie', 'Videojuego', 'Album'];
    
    for (const model of models) {
      const avgResult = await Review.aggregate([
        { $match: { onModel: model, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]);
      
      if (avgResult.length > 0 && avgResult[0].avg) {
        stats.avgRatings[model] = parseFloat(avgResult[0].avg.toFixed(1));
      }
    }
    
    return stats;
  } catch (error) {
    console.error("Error al obtener estadísticas actuales de contenido:", error);
    return {
      reviews: { Pelicula: 0, Serie: 0, Videojuego: 0, Album: 0 },
      contentCount: { Pelicula: 0, Serie: 0, Videojuego: 0, Album: 0 },
      avgRatings: { Pelicula: 0, Serie: 0, Videojuego: 0, Album: 0 },
      userActivity: Array(7).fill(0)
    };
  }
}

module.exports = {
  configureSocketServer
};