// test-landing-cache.js
// Script para probar el caché de las consultas de la landing page
const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Las 5 consultas de la landing page
const LANDING_QUERIES = [
  { name: 'Películas', url: `${BASE_URL}/api/pelicula` },
  { name: 'Series', url: `${BASE_URL}/api/serie` },
  { name: 'Videojuegos', url: `${BASE_URL}/api/videojuego` },
  { name: 'Álbumes', url: `${BASE_URL}/api/album` },
  { name: 'Reviews', url: `${BASE_URL}/api/reviews` }
];

async function testQuery(query, iteration) {
  const startTime = performance.now();
  let cacheStatus = 'UNKNOWN';
  let cacheTime = 0;
  let totalTime = 0;
  let error = null;

  try {
    const response = await axios.get(query.url, {
      timeout: 30000
    });
    
    totalTime = performance.now() - startTime;
    cacheStatus = response.headers['x-cache'] || 'UNKNOWN';
    cacheTime = parseInt(response.headers['x-cache-time']) || 0;
    
    return {
      iteration,
      name: query.name,
      totalTime,
      cacheStatus,
      cacheTime,
      success: true,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (err) {
    totalTime = performance.now() - startTime;
    error = err.message;
    return {
      iteration,
      name: query.name,
      totalTime,
      cacheStatus: 'ERROR',
      success: false,
      error
    };
  }
}

async function testLandingPage() {
  console.log('🚀 Test de Caché - Landing Page');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}\n`);

  // Primera ronda: CACHE MISS esperado
  console.log('📊 PRIMERA RONDA (CACHE MISS esperado):\n');
  const firstRound = [];
  
  for (const query of LANDING_QUERIES) {
    const result = await testQuery(query, 1);
    firstRound.push(result);
    
    const status = result.success ? '✅' : '❌';
    const cache = result.cacheStatus === 'HIT' ? '[HIT]' : '[MISS]';
    console.log(`${status} ${query.name}: ${result.totalTime.toFixed(2)}ms ${cache} (Redis: ${result.cacheTime}ms)`);
  }

  // Esperar un momento
  console.log('\n⏳ Esperando 2 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Segunda ronda: CACHE HIT esperado
  console.log('📊 SEGUNDA RONDA (CACHE HIT esperado):\n');
  const secondRound = [];
  
  for (const query of LANDING_QUERIES) {
    const result = await testQuery(query, 2);
    secondRound.push(result);
    
    const status = result.success ? '✅' : '❌';
    const cache = result.cacheStatus === 'HIT' ? '[HIT]' : '[MISS]';
    console.log(`${status} ${query.name}: ${result.totalTime.toFixed(2)}ms ${cache} (Redis: ${result.cacheTime}ms)`);
  }

  // Comparación
  console.log('\n' + '='.repeat(80));
  console.log('📈 COMPARACIÓN:\n');
  
  LANDING_QUERIES.forEach((query, index) => {
    const first = firstRound[index];
    const second = secondRound[index];
    
    if (first.success && second.success) {
      const improvement = first.totalTime - second.totalTime;
      const improvementPercent = (improvement / first.totalTime) * 100;
      const cacheWorking = second.cacheStatus === 'HIT';
      
      console.log(`📌 ${query.name}:`);
      console.log(`   Primera: ${first.totalTime.toFixed(2)}ms (${first.cacheStatus})`);
      console.log(`   Segunda: ${second.totalTime.toFixed(2)}ms (${second.cacheStatus})`);
      
      if (cacheWorking) {
        if (improvementPercent > 0) {
          console.log(`   ✅ Mejora: ${improvement.toFixed(2)}ms (${improvementPercent.toFixed(1)}%)`);
        } else {
          console.log(`   ⚠️  Caché HIT pero tiempo similar - Latencia de Redis: ${second.cacheTime}ms`);
          console.log(`   💡 La latencia de Upstash puede estar compensando la mejora`);
        }
      } else {
        console.log(`   ❌ Caché NO funcionando - Status: ${second.cacheStatus}`);
      }
      console.log('');
    }
  });

  // Resumen
  const workingCache = secondRound.filter(r => r.cacheStatus === 'HIT').length;
  const avgImprovement = secondRound
    .filter((r, i) => r.cacheStatus === 'HIT' && firstRound[i].success)
    .map((r, i) => {
      const first = firstRound[i];
      const improvement = first.totalTime - r.totalTime;
      return (improvement / first.totalTime) * 100;
    })
    .reduce((a, b) => a + b, 0) / workingCache || 0;

  console.log('📊 RESUMEN:');
  console.log(`   Caché funcionando: ${workingCache}/${LANDING_QUERIES.length} consultas`);
  if (workingCache > 0) {
    console.log(`   Mejora promedio: ${avgImprovement.toFixed(1)}%`);
  }
}

if (require.main === module) {
  testLandingPage()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { testLandingPage };

