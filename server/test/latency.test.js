// test/latency.test.js
const request = require('supertest');
const { performance } = require('perf_hooks');
const mongoose = require('mongoose');
const app = require('../server'); // Se importa la instancia de Express

describe('Medición de latencia de endpoints', () => {
  test('GET / - debería responder en menos de 1500ms', async () => {
    const start = performance.now();
    const response = await request(app).get('/');
    const end = performance.now();

    const latency = end - start;
    console.log(`Latency GET /: ${latency.toFixed(2)}ms`);

    expect(response.statusCode).toBe(200);
    expect(latency).toBeLessThan(1500);
  });

  test('GET /api/albums - debería responder en menos de 1500ms', async () => {
    const start = performance.now();
    const response = await request(app).get('/api/albums');
    const end = performance.now();

    const latency = end - start;
    console.log(`Latency GET /api/albums: ${latency.toFixed(2)}ms`);

    expect(response.statusCode).toBe(200);
    expect(latency).toBeLessThan(1500);
  });

  test('GET /api/peliculas - debería responder en menos de 1500ms', async () => {
    const start = performance.now();
    const response = await request(app).get('/api/peliculas');
    const end = performance.now();

    const latency = end - start;
    console.log(`Latency GET /api/peliculas: ${latency.toFixed(2)}ms`);

    expect(response.statusCode).toBe(200);
    expect(latency).toBeLessThan(1500);
  });

  test('GET /api/series - debería responder en menos de 1500ms', async () => {
    const start = performance.now();
    const response = await request(app).get('/api/series');
    const end = performance.now();

    const latency = end - start;
    console.log(`Latency GET /api/series: ${latency.toFixed(2)}ms`);

    expect(response.statusCode).toBe(200);
    expect(latency).toBeLessThan(1500);
  });

  test('GET /api/videojuegos - debería responder en menos de 1500ms', async () => {
    const start = performance.now();
    const response = await request(app).get('/api/videojuegos');
    const end = performance.now();

    const latency = end - start;
    console.log(`Latency GET /api/videojuegos: ${latency.toFixed(2)}ms`);

    expect(response.statusCode).toBe(200);
    expect(latency).toBeLessThan(1500);
  });
});

// Después de todos los tests, cerramos la conexión a la base de datos.
afterAll(async () => {
  await mongoose.connection.close();
});
