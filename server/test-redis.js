// test-redis.js
require('dotenv').config();
const { getRedisClient, cache } = require('./config/redis');

async function test() {
  console.log('🔍 Iniciando test de Redis...\n');
  
  const client = await getRedisClient();
  if (!client) {
    console.log('❌ No se pudo conectar a Redis');
    console.log('💡 Verifica que REDIS_URL esté configurado en .env');
    return;
  }
  
  console.log('✅ Conectado a Redis\n');
  
  // Test 1: Escritura simple con TTL
  console.log('📝 Test 1: Escritura simple con TTL (30 min)');
  const testKey = 'test:manual:' + Date.now();
  const testValue = { message: 'Hola desde test', timestamp: Date.now() };
  
  const saved = await cache.set(testKey, testValue, 3600);
  console.log('   Resultado guardado:', saved ? '✅' : '❌');
  
  // Test 1b: Escritura SIN TTL (debería aparecer en Data Browser)
  console.log('\n📝 Test 1b: Escritura SIN TTL (para Data Browser)');
  try {
    const testKeyNoTTL = 'test:permanent:' + Date.now();
    const testValueNoTTL = { message: 'Clave permanente para Data Browser', timestamp: Date.now() };
    // Guardar sin TTL usando set directamente
    await client.set(testKeyNoTTL, JSON.stringify(testValueNoTTL));
    console.log('   Clave permanente guardada:', testKeyNoTTL);
    console.log('   ✅ Esta clave debería aparecer en el Data Browser de Upstash');
  } catch (error) {
    console.error('   ❌ Error guardando clave permanente:', error.message);
  }
  
  // Test 2: Lectura
  console.log('\n📖 Test 2: Lectura');
  const retrieved = await cache.get(testKey);
  console.log('   Resultado recuperado:', retrieved ? '✅' : '❌');
  if (retrieved) {
    console.log('   Datos:', JSON.stringify(retrieved).substring(0, 100) + '...');
  }
  
  // Test 3: Listar todas las claves
  console.log('\n📋 Test 3: Listar claves');
  try {
    const keys = await client.keys('*');
    console.log(`   Total de claves: ${keys.length}`);
    if (keys.length > 0) {
      console.log('   Primeras 10 claves:');
      keys.slice(0, 10).forEach((key, i) => {
        console.log(`     ${i + 1}. ${key}`);
      });
    } else {
      console.log('   ⚠️  No hay claves en Redis');
    }
  } catch (error) {
    console.error('   ❌ Error listando claves:', error.message);
  }
  
  // Test 4: Claves de caché específicas
  console.log('\n🔍 Test 4: Buscar claves de caché');
  try {
    const cacheKeys = await client.keys('cache:*');
    console.log(`   Claves de caché encontradas: ${cacheKeys.length}`);
    if (cacheKeys.length > 0) {
      console.log('   Primeras 5 claves de caché:');
      cacheKeys.slice(0, 5).forEach((key, i) => {
        console.log(`     ${i + 1}. ${key}`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error buscando claves de caché:', error.message);
  }
  
  // Test 5: Verificar TTL
  console.log('\n⏱️  Test 5: Verificar TTL de clave de test');
  try {
    const ttl = await client.ttl(testKey);
    console.log(`   TTL de ${testKey}: ${ttl} segundos`);
  } catch (error) {
    console.error('   ❌ Error verificando TTL:', error.message);
  }
  
  // Test 6: Información del servidor
  console.log('\n📊 Test 6: Información del servidor Redis');
  try {
    const info = await client.info('server');
    const lines = info.split('\r\n').filter(l => l && !l.startsWith('#'));
    console.log('   Información del servidor:');
    lines.slice(0, 5).forEach(line => {
      console.log(`     ${line}`);
    });
  } catch (error) {
    console.error('   ❌ Error obteniendo info:', error.message);
  }
  
  // Test 7: Verificar base de datos actual
  console.log('\n🗄️  Test 7: Verificar base de datos actual');
  try {
    const dbInfo = await client.configGet('databases');
    console.log('   Configuración de bases de datos:', dbInfo);
    
    // Intentar cambiar a DB 0 explícitamente (por si acaso)
    // Nota: Upstash puede no permitir SELECT, pero lo intentamos
    try {
      await client.select(0);
      console.log('   ✅ Base de datos 0 seleccionada');
    } catch (selectError) {
      console.log('   ⚠️  No se puede cambiar de base de datos (normal en Upstash):', selectError.message);
    }
  } catch (error) {
    console.error('   ❌ Error verificando base de datos:', error.message);
  }
  
  // Test 8: Guardar claves de caché reales para verificar
  console.log('\n💾 Test 8: Guardar claves de caché de ejemplo');
  try {
    const cacheKey1 = 'cache:pelicula:test123';
    const cacheValue1 = { data: ['pelicula1', 'pelicula2'], timestamp: Date.now() };
    await cache.set(cacheKey1, cacheValue1, 1800);
    console.log('   ✅ Clave de caché guardada:', cacheKey1);
    
    const cacheKey2 = 'cache:serie:test456';
    const cacheValue2 = { data: ['serie1', 'serie2'], timestamp: Date.now() };
    await cache.set(cacheKey2, cacheValue2, 1800);
    console.log('   ✅ Clave de caché guardada:', cacheKey2);
    
    console.log('\n   💡 Estas claves deberían aparecer en Upstash Data Browser:');
    console.log('      - Busca por patrón: cache:*');
    console.log('      - O busca: test:permanent:*');
  } catch (error) {
    console.error('   ❌ Error guardando claves de caché:', error.message);
  }
  
  console.log('\n✅ Test completado');
  process.exit(0);
}

test().catch(error => {
  console.error('❌ Error en test:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

