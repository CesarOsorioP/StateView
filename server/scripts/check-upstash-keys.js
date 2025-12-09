// check-upstash-keys.js
// Script para verificar y mostrar todas las claves en Upstash
require('dotenv').config();
const { getRedisClient, cache } = require('../config/redis');

async function checkKeys() {
  console.log('🔍 Verificando claves en Upstash Redis...\n');
  
  const client = await getRedisClient();
  if (!client) {
    console.log('❌ No se pudo conectar a Redis');
    return;
  }
  
  try {
    // 1. Listar TODAS las claves
    console.log('📋 1. Todas las claves:');
    const allKeys = await client.keys('*');
    console.log(`   Total: ${allKeys.length} claves`);
    if (allKeys.length > 0) {
      allKeys.forEach((key, i) => {
        console.log(`   ${i + 1}. ${key}`);
      });
    } else {
      console.log('   ⚠️  No hay claves en Redis');
    }
    
    // 2. Claves de caché
    console.log('\n📋 2. Claves de caché (cache:*):');
    const cacheKeys = await client.keys('cache:*');
    console.log(`   Total: ${cacheKeys.length} claves`);
    if (cacheKeys.length > 0) {
      cacheKeys.forEach((key, i) => {
        console.log(`   ${i + 1}. ${key}`);
      });
    }
    
    // 3. Claves de test
    console.log('\n📋 3. Claves de test (test:*):');
    const testKeys = await client.keys('test:*');
    console.log(`   Total: ${testKeys.length} claves`);
    if (testKeys.length > 0) {
      testKeys.forEach((key, i) => {
        console.log(`   ${i + 1}. ${key}`);
      });
    }
    
    // 4. Verificar TTL de algunas claves
    console.log('\n⏱️  4. TTL de claves (primeras 5):');
    const keysToCheck = allKeys.slice(0, 5);
    for (const key of keysToCheck) {
      try {
        const ttl = await client.ttl(key);
        const value = await client.get(key);
        const size = value ? (value.length / 1024).toFixed(2) : '0';
        console.log(`   ${key}:`);
        console.log(`     TTL: ${ttl === -1 ? 'Sin expiración' : ttl + ' segundos'}`);
        console.log(`     Tamaño: ${size} KB`);
      } catch (err) {
        console.log(`   ${key}: Error - ${err.message}`);
      }
    }
    
    // 5. Guardar una clave permanente para verificar en Data Browser
    console.log('\n💾 5. Guardando clave permanente para Data Browser:');
    const permanentKey = 'upstash:test:permanent';
    const permanentValue = {
      message: 'Esta clave debería aparecer en el Data Browser',
      created: new Date().toISOString(),
      test: true
    };
    
    // Guardar SIN TTL (permanente)
    await client.set(permanentKey, JSON.stringify(permanentValue));
    console.log(`   ✅ Clave guardada: ${permanentKey}`);
    console.log(`   💡 Busca esta clave en el Data Browser de Upstash`);
    
    // Verificar que se guardó
    const retrieved = await client.get(permanentKey);
    if (retrieved) {
      console.log(`   ✅ Clave verificada: ${retrieved.substring(0, 100)}...`);
    }
    
    console.log('\n✅ Verificación completada');
    console.log('\n💡 Instrucciones para Upstash Data Browser:');
    console.log('   1. Ve a tu dashboard de Upstash');
    console.log('   2. Abre el Data Browser');
    console.log('   3. Busca por patrón: * (todas las claves)');
    console.log('   4. O busca específicamente: upstash:test:permanent');
    console.log('   5. Si no aparece, intenta refrescar la página');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.quit();
    process.exit(0);
  }
}

checkKeys().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

