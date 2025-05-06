// src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './userManagement.css';
import api from '../../api/api'

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contraseña: '',
    rol: 'Usuario',
    imagenPerfil: ''
  });

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/persona/');
        setUsers(res.data.data);
        setError('');
      } catch (error) {
        setError('Error al cargar los usuarios. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para enviar el formulario (crear o actualizar usuario)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedUser) {
        // Actualizar usuario
        const res = await api.put(`/api/persona/${selectedUser}`, formData);
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === selectedUser ? res.data.data : u))
        );
        setSuccess('Usuario actualizado con éxito');
      } else {
        // Crear nuevo usuario
        const res = await api.post('/api/persona', formData);
        setUsers((prev) => [...prev, res.data.data]);
        setSuccess('Usuario creado con éxito');
        closeModal(); // Cerrar el modal después de crear
      }
      resetForm();
    } catch (error) {
      setError(selectedUser 
        ? 'Error actualizando el usuario. Por favor, intenta de nuevo.' 
        : 'Error creando el usuario. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del usuario a editar
  const handleEdit = (userId) => {
    const userToEdit = users.find((u) => u._id === userId);
    if (userToEdit) {
      setSelectedUser(userId);
      setFormData({
        nombre: userToEdit.nombre,
        email: userToEdit.email,
        contraseña: '', // No mostrar contraseña actual
        rol: userToEdit.rol,
        imagenPerfil: userToEdit.imagenPerfil || ''
      });
      setIsModalOpen(true); // Abrir el modal para editar
    }
  };

  // Eliminar usuario
  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro que deseas eliminar este usuario?')) {
      setLoading(true);
      try {
        await api.delete(`/api/persona/${userId}`);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setSuccess('Usuario eliminado con éxito');
      } catch (error) {
        setError('Error al eliminar el usuario. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Reiniciar formulario
  const resetForm = () => {
    setSelectedUser(null);
    setFormData({
      nombre: '',
      email: '',
      contraseña: '',
      rol: 'Usuario',
      imagenPerfil: ''
    });
  };

  // Abrir modal para crear nuevo usuario
  const openCreateModal = () => {
    resetForm();
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Si todavía no tenemos el usuario cargado, podemos mostrar un mensaje "Cargando..."
  if (!user) {
    return (
      <div className="user-management-page">
        <div className="loading-block">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Verificar que el usuario tenga permisos (Administrador o Moderador)
  if (user.rol !== 'Administrador' && user.rol !== 'Moderador') {
    return (
      <div className="user-management-page">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para ver esta sección. Esta área está restringida a Administradores y Moderadores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <button 
          className="create-button" 
          onClick={openCreateModal}
        >
          Crear Nueva Persona
        </button>
      </div>
      
      {error && <div className="status-message error-message">{error}</div>}
      {success && <div className="status-message success-message">{success}</div>}
      
      {loading && !users.length ? (
        <div className="loading-block">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
                <td>
                  <button 
                    className="action-button" 
                    onClick={() => handleEdit(u._id)}
                  >
                    Editar
                  </button>
                  <button 
                    className="action-button delete" 
                    onClick={() => handleDelete(u._id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal para crear/editar usuario */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedUser ? 'Editar Usuario' : 'Crear Nueva Persona'}</h2>
              <button 
                className="close-modal-button" 
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            
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
                  placeholder={selectedUser ? 'Deja vacío para no cambiar' : ''}
                  required={!selectedUser}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="rol">Rol:</label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Usuario">Usuario</option>
                  <option value="Moderador">Moderador</option>
                  <option value="Administrador">Administrador</option>
                </select>
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
                <button type="submit" className="form-button primary" disabled={loading}>
                  {loading ? 'Procesando...' : selectedUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="form-button secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;