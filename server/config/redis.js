const redis = require('redis');

let redisClient = null;

const getRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }

  // Para Upstash, usar 'rediss://' (con doble 's') para TLS
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  // Si la URL contiene 'upstash.io', asegurar que use rediss://
  const finalUrl = redisUrl.includes('upstash.io') && !redisUrl.startsWith('rediss://')
    ? redisUrl.replace('redis://', 'rediss://')
    : redisUrl;

  const isUpstash = redisUrl.includes('upstash.io');

  const client = redis.createClient({
    url: finalUrl,
    socket: {
      tls: isUpstash, // Habilitar TLS para Upstash
      keepAlive: true,
      connectTimeout: 10000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Demasiados intentos de reconexión');
          return new Error('Demasiados intentos de reconexión');
        }
        return retries * 100;
      }
    },
    pingInterval: 30000,
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    const provider = isUpstash ? 'Upstash' : 'Local';
    console.log(`✅ Redis conectado (${provider})`);
  });

  try {
    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    console.error('Error conectando a Redis:', error);
    return null;
  }
};

// Función helper para cachear
const cache = {
  async get(key) {
    try {
      const client = await getRedisClient();
      if (!client) {
        console.error('[CACHE] Redis client no disponible para GET');
        return null;
      }
      const value = await client.get(key);
      if (value) {
        console.log(`[CACHE GET] Key: ${key} - Found: true - Size: ${(value.length / 1024).toFixed(2)}KB`);
      } else {
        console.log(`[CACHE GET] Key: ${key} - Found: false`);
      }
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[CACHE GET ERROR]', error.message);
      console.error('[CACHE GET ERROR] Stack:', error.stack);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      const client = await getRedisClient();
      if (!client) {
        console.error('[CACHE] Redis client no disponible para SET');
        return false;
      }
      
      const serialized = JSON.stringify(value);
      const result = await client.setEx(key, ttl, serialized);
      
      // Log de confirmación
      console.log(`[CACHE SET] Key: ${key} - TTL: ${ttl}s - Size: ${(serialized.length / 1024).toFixed(2)}KB - Success: ${result}`);
      
      return true;
    } catch (error) {
      console.error('[CACHE SET ERROR]', error.message);
      console.error('[CACHE SET ERROR] Stack:', error.stack);
      return false;
    }
  },

  async del(key) {
    try {
      const client = await getRedisClient();
      if (!client) return false;
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL Error:', error.message);
      return false;
    }
  }
};

module.exports = { getRedisClient, cache };

