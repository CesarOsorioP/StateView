// src/api/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Crea una instancia de axios con la URL base ya configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // Opcional, si usas cookies/sesiones
});

export default api;
