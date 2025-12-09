const { cache } = require('../config/redis');
const crypto = require('crypto');

/**
 * Genera una clave de caché única basada en la petición
 */
const generateCacheKey = (req, prefix = 'pelicula') => {
  const keyData = {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params
  };
  const keyString = JSON.stringify(keyData);
  return `cache:${prefix}:${crypto.createHash('md5').update(keyString).digest('hex')}`;
};

/**
 * Middleware de caché genérico para GET requests
 * @param {String} prefix - Prefijo para la clave de caché (ej: 'pelicula', 'serie')
 * @param {Number} ttl - Tiempo de vida del caché en segundos (default: 1800 = 30 min)
 */
const createCacheMiddleware = (prefix, ttl = 1800) => {
  return async (req, res, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req, prefix);
    const startTime = Date.now();
    let responseData = null;
    let responseSent = false;
    
    try {
      // Intentar obtener del caché
      const cacheStartTime = Date.now();
      const cachedData = await cache.get(cacheKey);
      const cacheDuration = Date.now() - cacheStartTime;
      
      if (cachedData !== null && cachedData !== undefined) {
        // Agregar header para indicar que es caché
        const totalTime = Date.now() - startTime;
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Time', `${cacheDuration}ms`);
        res.setHeader('X-Total-Time', `${totalTime}ms`);
        console.log(`[CACHE HIT] ${req.method} ${req.path} - Redis: ${cacheDuration}ms - Total: ${totalTime}ms`);
        // Retornar inmediatamente sin ejecutar el controlador
        return res.json(cachedData);
      }

      // Si no está en caché, interceptar la respuesta
      const totalTime = Date.now() - startTime;
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Time', `${cacheDuration}ms`);
      console.log(`[CACHE MISS] ${req.method} ${req.path} - Redis check: ${cacheDuration}ms - Key: ${cacheKey.substring(0, 40)}...`);
      
      // Guardar referencias originales
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      const originalEnd = res.end.bind(res);
      const dbStartTime = Date.now();
      
      // Función para guardar en caché
      const saveToCache = (data) => {
        if (responseSent) {
          console.log(`[CACHE SKIP] ${req.method} ${req.path} - Ya se guardó anteriormente`);
          return; // Evitar guardar múltiples veces
        }
        responseSent = true;
        responseData = data;
        
        const saveStartTime = Date.now();
        cache.set(cacheKey, data, ttl)
          .then(() => {
            const saveDuration = Date.now() - saveStartTime;
            console.log(`[CACHE SAVED] ${req.method} ${req.path} - Key: ${cacheKey.substring(0, 40)}... - Redis save: ${saveDuration}ms - TTL: ${ttl}s`);
          })
          .catch(err => {
            console.error(`[CACHE SAVE ERROR] ${req.method} ${req.path}:`, err.message);
            console.error('Stack:', err.stack);
          });
      };
      
      // Interceptar res.json
      res.json = function(data) {
        const dbDuration = Date.now() - dbStartTime;
        const totalRequestTime = Date.now() - startTime;
        
        console.log(`[DB QUERY] ${req.method} ${req.path} - DB: ${dbDuration}ms - Total: ${totalRequestTime}ms`);
        
        // Guardar en caché
        saveToCache(data);
        
        // Llamar al método original
        return originalJson(data);
      };
      
      // También interceptar res.send por si acaso
      res.send = function(data) {
        if (!responseSent) {
          const dbDuration = Date.now() - dbStartTime;
          console.log(`[DB QUERY] ${req.method} ${req.path} - DB: ${dbDuration}ms (via send)`);
          saveToCache(data);
        }
        return originalSend(data);
      };
      
      // Interceptar res.end como respaldo
      res.end = function(...args) {
        if (!responseSent && responseData) {
          console.log(`[CACHE BACKUP] Guardando en res.end para ${req.method} ${req.path}`);
          saveToCache(responseData);
        }
        return originalEnd(...args);
      };

      next();
    } catch (error) {
      console.error(`[CACHE ERROR] ${req.method} ${req.path}:`, error.message);
      console.error('Stack:', error.stack);
      res.setHeader('X-Cache', 'ERROR');
      next(); // Continuar sin caché si hay error
    }
  };
};

/**
 * Middleware de caché para GET requests de películas
 * @param {Number} ttl - Tiempo de vida del caché en segundos (default: 1800 = 30 min)
 */
const cachePeliculasMiddleware = (ttl = 1800) => {
  return createCacheMiddleware('pelicula', ttl);
};

/**
 * Middleware de caché para GET requests de series
 * @param {Number} ttl - Tiempo de vida del caché en segundos (default: 1800 = 30 min)
 */
const cacheSeriesMiddleware = (ttl = 1800) => {
  return createCacheMiddleware('serie', ttl);
};

/**
 * Middleware de caché para GET requests de videojuegos
 * @param {Number} ttl - Tiempo de vida del caché en segundos (default: 1800 = 30 min)
 */
const cacheVideojuegosMiddleware = (ttl = 1800) => {
  return createCacheMiddleware('videojuego', ttl);
};

/**
 * Middleware de caché para GET requests de álbumes
 * @param {Number} ttl - Tiempo de vida del caché en segundos (default: 1800 = 30 min)
 */
const cacheAlbumesMiddleware = (ttl = 1800) => {
  return createCacheMiddleware('album', ttl);
};

/**
 * Middleware de caché para GET requests de reviews
 * @param {Number} ttl - Tiempo de vida del caché en segundos (default: 900 = 15 min)
 */
const cacheReviewsMiddleware = (ttl = 900) => {
  return createCacheMiddleware('review', ttl);
};

/**
 * Invalidar caché por prefijo
 */
const invalidateCacheByPrefix = async (prefix) => {
  try {
    const { getRedisClient } = require('../config/redis');
    const client = await getRedisClient();
    if (!client) return false;
    
    // Obtener todas las claves de caché con el prefijo
    const keys = await client.keys(`cache:${prefix}:*`);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️  Caché de ${prefix} invalidado (${keys.length} claves)`);
    }
    return true;
  } catch (error) {
    console.error(`Error invalidando caché de ${prefix}:`, error);
    return false;
  }
};

/**
 * Invalidar caché de películas
 */
const invalidatePeliculasCache = async () => {
  return invalidateCacheByPrefix('pelicula');
};

/**
 * Invalidar caché de series
 */
const invalidateSeriesCache = async () => {
  return invalidateCacheByPrefix('serie');
};

/**
 * Invalidar caché de videojuegos
 */
const invalidateVideojuegosCache = async () => {
  return invalidateCacheByPrefix('videojuego');
};

/**
 * Invalidar caché de álbumes
 */
const invalidateAlbumesCache = async () => {
  return invalidateCacheByPrefix('album');
};

/**
 * Invalidar caché de reviews
 */
const invalidateReviewsCache = async () => {
  return invalidateCacheByPrefix('review');
};

module.exports = { 
  cachePeliculasMiddleware,
  cacheSeriesMiddleware,
  cacheVideojuegosMiddleware,
  cacheAlbumesMiddleware,
  cacheReviewsMiddleware,
  invalidatePeliculasCache,
  invalidateSeriesCache,
  invalidateVideojuegosCache,
  invalidateAlbumesCache,
  invalidateReviewsCache
};

