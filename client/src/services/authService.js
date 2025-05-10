import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configuración para incluir automáticamente el token en las solicitudes
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const authService = {
  // Registro de usuario
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/signup`, userData);
    return response.data;
  },

  // Iniciar sesión
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', response.data.tipoUsuario);
      localStorage.setItem('userName', response.data.nombre);
      localStorage.setItem('userId', response.data.id);
    }
    return response.data;
  },

  // Cerrar sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/api/auth/current-user`);
    return response.data;
  },

  // Solicitar restablecimiento de contraseña
  requestPasswordReset: async (email) => {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    return response.data;
  },

  // Validar token de restablecimiento
  validateResetToken: async (token) => {
    const response = await axios.get(`${API_URL}/api/auth/reset-password/${token}`);
    return response.data;
  },

  // Restablecer contraseña
  resetPassword: async (token, contraseña) => {
    const response = await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { contraseña });
    return response.data;
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return localStorage.getItem('token') ? true : false;
  },

  // Obtener rol del usuario
  getUserRole: () => {
    return localStorage.getItem('userType');
  }
};

export default authService;