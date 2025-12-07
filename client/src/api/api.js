import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Opcional, si usas cookies o sesiones
  timeout: 5000, // Tiempo límite en milisegundos para las peticiones
});

// (Opcional) Agrega un interceptor para manejar errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en la API:', error);
    return Promise.reject(error);
  }
);

// Interceptor para adjuntar el token JWT en todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;