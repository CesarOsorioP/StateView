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
          const userData = {
            ...response.data,
            rol: response.data.tipoUsuario || response.data.rol
          };
          
          // Actualizamos el cacheBuster para forzar la recarga de imágenes
          window.profileImageCacheBuster = Date.now();
          
          // Guardamos el usuario en el estado
          setUser(userData);
          
          // También guardamos en localStorage para mayor persistencia
          localStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
          console.error("Error checking authentication:", error);
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
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
      
      // Almacenamos el token
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
      console.log("Tipo de Usuario:", userData.rol);
      console.log("Datos completos del usuario cargados");
      
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
    localStorage.removeItem('userData');
    window.profileImageCacheBuster = null;
    setUser(null);
  };
  
  // Nueva función para actualizar información del usuario en el contexto
  const updateUserContext = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);