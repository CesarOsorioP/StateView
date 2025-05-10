// src/components/Profile/PerfilUsuario.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './PerfilUsuario.css';
import api from '../../api/api';

const PerfilUsuario = () => {
  const { user, updateUserContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contraseña: '',
    imagenPerfil: ''
  });
  
  console.log("Estado actual del usuario:", user); // Para depuración

  // Cargar datos del usuario actual
  useEffect(() => {
    if (user) {
      // Guardar una copia del usuario en el estado local
      setUserData(user);
      
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        contraseña: '',
        imagenPerfil: user.imagenPerfil || ''
      });
      
      // Log para depuración
      console.log('Usuario cargado en el formulario:', {
        id: user._id || user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        imagenPerfil: user.imagenPerfil
      });
    } else {
      console.log('Usuario no disponible en el contexto de autenticación');
    }
  }, [user]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para guardar los cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verificar si el usuario está autenticado y tiene un ID válido
      if (!user) {
        throw new Error('No se ha iniciado sesión');
      }
      
      // Verificar si existe el ID del usuario (puede estar como _id o id dependiendo del backend)
      const userId = user._id || user.id;
      
      if (!userId) {
        console.error('ID de usuario no encontrado en:', user);
        throw new Error('No se pudo encontrar el ID del usuario');
      }

      // Preparar los datos para actualizar
      const updateData = {
        nombre: formData.nombre,
        email: formData.email,
        imagenPerfil: formData.imagenPerfil
      };

      // Solo incluir contraseña si se ha proporcionado una nueva
      if (formData.contraseña) {
        updateData.contraseña = formData.contraseña;
      }

      console.log('Actualizando usuario con ID:', userId);
      
      // Actualizar usuario
      const res = await api.put(`/api/persona/${userId}`, updateData);
      
      // Verificar la respuesta del servidor
      if (!res.data || !res.data.data) {
        console.error('Respuesta del servidor inválida:', res);
        throw new Error('Respuesta inválida del servidor');
      }
      
      console.log('Respuesta del servidor:', res.data);
      
      // Actualizar el estado local con los nuevos datos
      const updatedUser = res.data.data;
      
      // Actualizar el estado local primero
      setUserData(updatedUser);
      
      // Actualizar el contexto de autenticación con los nuevos datos del usuario
      if (updateUserContext) {
        // Asegurarse de que mantenemos todos los datos originales y solo actualizamos los nuevos
        updateUserContext({
          ...user,
          ...updatedUser
        });
      }
      
      setSuccess('Perfil actualizado con éxito');
      setIsEditing(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
      setError(`Error actualizando el perfil: ${errorMsg}`);
      console.error('Error al actualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar a modo edición
  const enableEditMode = () => {
    setIsEditing(true);
  };

  // Cancelar edición
  const cancelEdit = () => {
    // Restaurar datos originales del usuario
    if (userData) {
      setFormData({
        nombre: userData.nombre || '',
        email: userData.email || '',
        contraseña: '',
        imagenPerfil: userData.imagenPerfil || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Si todavía no tenemos el usuario cargado, podemos mostrar un mensaje "Cargando..."
  if (!userData) {
    return (
      <div className="profile-page">
        <div className="loading-block">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Función para obtener el ID del usuario (puede ser _id o id según el backend)
  const getUserId = () => {
    if (!userData) return '';
    return userData._id || userData.id || '';
  };

  // Función para verificar si una URL es válida
  const isValidImageUrl = (url) => {
    return url && url.trim() !== '';
  };

  return (
    <div className="perfil-usuario-page">
      <div className="page-header">
        <h1>Mi Perfil</h1>
        {!isEditing && (
          <button 
            className="create-button"
            onClick={enableEditMode}
          >
            Editar Perfil
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <hr className="gradient-divider" />
      
      <div className="perfil-container">
        <div className="perfil-imagen">
          {isValidImageUrl(userData.imagenPerfil) ? (
            <img 
              src={userData.imagenPerfil} 
              alt="Imagen de perfil" 
              onError={(e) => {
                console.log('Error cargando imagen:', e);
                e.target.src = "https://via.placeholder.com/180x180.png?text=Profile";
              }}
            />
          ) : (
            <img 
              src="https://via.placeholder.com/180x180.png?text=Profile" 
              alt="Imagen de perfil por defecto" 
            />
          )}
          <div className="perfil-id">
            ID: {getUserId()}
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contraseña">Contraseña:</label>
              <input
                id="contraseña"
                type="password"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleInputChange}
                placeholder="Deja vacío para no cambiar"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="imagenPerfil">Imagen de Perfil:</label>
              <input
                id="imagenPerfil"
                type="text"
                name="imagenPerfil"
                value={formData.imagenPerfil}
                onChange={handleInputChange}
                placeholder="URL de la imagen..."
                className="form-input"
              />
            </div>
            
            <div className="form-buttons">
              <button 
                type="submit" 
                className="form-button primary" 
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="form-button secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="perfil-detalles">
            <div className="detalle-item">
              <h3>Nombre</h3>
              <p>{userData.nombre || 'No especificado'}</p>
            </div>
            
            <div className="detalle-item">
              <h3>Email</h3>
              <p>{userData.email || 'No especificado'}</p>
            </div>
            
            <div className="detalle-item">
              <h3>Rol</h3>
              <p>{userData.rol || 'No especificado'}</p>
            </div>
            
            <div className="detalle-item">
              <h3>ID de Usuario</h3>
              <p>{getUserId()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;