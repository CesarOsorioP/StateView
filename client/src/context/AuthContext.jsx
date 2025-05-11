import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api'

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Si la respuesta tiene la propiedad 'tipoUsuario', la mapeamos a 'rol'
          setUser({
            ...response.data,
            rol: response.data.tipoUsuario || response.data.rol
          });
        } catch (error) {
          console.error("Error checking authentication:", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    checkLoggedIn();
  }, []);

  const login = async (identifier, contraseña) => {
    try {
      // Usamos identifier en lugar de email para coincidir con el componente Login
      const response = await api.post("/api/auth/login", { 
        email: identifier, // Mantener "email" como nombre del campo para el backend
        contraseña 
      });
      
      // Almacenamos el token y actualizamos el estado del usuario
      localStorage.setItem("token", response.data.token);
      // Asignamos la propiedad 'rol' para mayor consistencia
      setUser({
        id: response.data.id,
        email: identifier,
        rol: response.data.tipoUsuario, // Mapea a 'rol'
        nombre: response.data.nombre
      });
      
      // Mostrar en la consola el token y el tipo de usuario
      console.log("Token recibido:", response.data.token);
      console.log("Tipo de Usuario:", response.data.tipoUsuario);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || "Error al iniciar sesión" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);