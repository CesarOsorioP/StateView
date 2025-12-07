import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import '../styles/GestionarInsignias.css';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';

const rolesPermitidos = ['Moderador', 'Administrador', 'Superadministrador'];

const getAllowedActions = (user) => {
  if (!user) return { canCreate: false, canAssign: false, canEdit: false, canDelete: false };
  switch(user.rol) {
    case 'Superadministrador':
      return { canCreate: true, canAssign: true, canEdit: true, canDelete: true };
    case 'Administrador':
      return { canCreate: true, canAssign: true, canEdit: true, canDelete: true };
    case 'Moderador':
      return { canCreate: false, canAssign: true, canEdit: false, canDelete: false };
    default:
      return { canCreate: false, canAssign: false, canEdit: false, canDelete: false };
  }
};

const GestionarInsignias = () => {
  const { user } = useAuth();
  const { canCreate, canAssign, canEdit, canDelete } = getAllowedActions(user);
  const [insignias, setInsignias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInsignia, setSelectedInsignia] = useState(null);
  const [newInsignia, setNewInsignia] = useState({
    nombre: '',
    descripcion: '',
    imagen: null
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarInsignias();
    cargarUsuarios();
  }, []);

  const cargarInsignias = async () => {
    try {
      const res = await api.get('/api/insignias');
      setInsignias(res.data.data);
    } catch (e) {
      setError('Error cargando insignias');
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/api/persona');
      setUsuarios(res.data.data);
    } catch (e) {
      setError('Error cargando usuarios');
    }
  };

  const handleImageChange = (e) => {
    setNewInsignia({
      ...newInsignia,
      imagen: e.target.files[0]
    });
  };

  const handleCreateInsignia = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nombre', newInsignia.nombre);
      formData.append('descripcion', newInsignia.descripcion);
      formData.append('imagen', newInsignia.imagen);

      const userData = JSON.parse(localStorage.getItem('userData'));
      await api.post('/api/insignias/crear', formData, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      setSuccess('Insignia creada correctamente');
      setShowCreateModal(false);
      setNewInsignia({ nombre: '', descripcion: '', imagen: null });
      cargarInsignias();
    } catch (e) {
      setError(e.response?.data?.error || 'Error creando insignia');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInsignia = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nombre', newInsignia.nombre);
      formData.append('descripcion', newInsignia.descripcion);
      if (newInsignia.imagen) {
        formData.append('imagen', newInsignia.imagen);
      }

      const userData = JSON.parse(localStorage.getItem('userData'));
      await api.put(`/api/insignias/${selectedInsignia._id}`, formData, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      setSuccess('Insignia editada correctamente');
      setShowEditModal(false);
      setSelectedInsignia(null);
      setNewInsignia({ nombre: '', descripcion: '', imagen: null });
      cargarInsignias();
    } catch (e) {
      setError(e.response?.data?.error || 'Error editando insignia');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInsignia = async (insigniaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta insignia?')) {
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      await api.delete(`/api/insignias/${insigniaId}`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      setSuccess('Insignia eliminada correctamente');
      cargarInsignias();
    } catch (e) {
      setError(e.response?.data?.error || 'Error eliminando insignia');
    }
  };

  const handleAsignarInsignia = async (userId, insigniaId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      await api.post('/api/insignias/asignar', 
        { userId, insigniaId },
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      setSuccess('Insignia asignada correctamente');
      cargarInsignias();
      cargarUsuarios();
    } catch (e) {
      setError(e.response?.data?.error || 'Error asignando insignia');
    }
  };

  const handleQuitarInsignia = async (userId, insigniaId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      await api.post('/api/insignias/quitar', 
        { userId, insigniaId },
        {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        }
      );
      setSuccess('Insignia quitada correctamente');
      cargarInsignias();
      cargarUsuarios();
    } catch (e) {
      setError(e.response?.data?.error || 'Error quitando insignia');
    }
  };

  const openEditModal = (insignia) => {
    setSelectedInsignia(insignia);
    setNewInsignia({
      nombre: insignia.nombre,
      descripcion: insignia.descripcion,
      imagen: null
    });
    setShowEditModal(true);
  };

  if (!user || (!canCreate && !canAssign && !canEdit && !canDelete)) {
    return <div className="no-permission">No tienes permisos para gestionar insignias.</div>;
  }

  return (
    <div className="gestionar-insignias-container">
      <div className="header">
        <h1>Gestionar Insignias</h1>
        {canCreate && (
          <button 
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            Crear Nueva Insignia
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="filters-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar usuario por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      <div className="insignias-grid">
        {insignias.map(insignia => (
          <div key={insignia._id} className="insignia-card">
            <div className="insignia-header">
              <img src={insignia.imagen} alt={insignia.nombre} className="insignia-image" />
              {(canEdit || canDelete) && (
                <div className="insignia-actions">
                  {canEdit && (
                    <button 
                      onClick={() => openEditModal(insignia)}
                      className="edit-button"
                      title="Editar insignia"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={() => handleDeleteInsignia(insignia._id)}
                      className="delete-button"
                      title="Eliminar insignia"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              )}
            </div>
            <h3>{insignia.nombre}</h3>
            <p>{insignia.descripcion}</p>
            <div className="usuarios-list">
              <h4>Usuarios con esta insignia:</h4>
              {insignia.usuarios.map(usuario => (
                <div key={usuario._id} className="usuario-item">
                  <span>{usuario.nombre}</span>
                  {canAssign && (
                    <button 
                      onClick={() => handleQuitarInsignia(usuario._id, insignia._id)}
                      className="remove-button"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canAssign && (
              <div className="usuarios-list">
                <h4>Asignar a usuario:</h4>
                <select
                  onChange={e => handleAsignarInsignia(e.target.value, insignia._id)}
                  defaultValue=""
                >
                  <option value="" disabled>Selecciona usuario</option>
                  {usuarios
                    .filter(u => 
                      !insignia.usuarios.some(iu => iu._id === u._id) &&
                      (u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(u => (
                    <option key={u._id} value={u._id}>{u.nombre} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreateModal && canCreate && (
        <div className="modal">
          <div className="modal-content">
            <button
              className="close-modal-button"
              onClick={() => setShowCreateModal(false)}
            >
              &times;
            </button>
            <h2>Crear Nueva Insignia</h2>
            <form onSubmit={handleCreateInsignia}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newInsignia.nombre}
                  onChange={(e) => setNewInsignia({...newInsignia, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newInsignia.descripcion}
                  onChange={(e) => setNewInsignia({...newInsignia, descripcion: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Imagen:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Insignia'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && canEdit && selectedInsignia && (
        <div className="modal">
          <div className="modal-content">
            <button
              className="close-modal-button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedInsignia(null);
                setNewInsignia({ nombre: '', descripcion: '', imagen: null });
              }}
            >
              &times;
            </button>
            <h2>Editar Insignia</h2>
            <form onSubmit={handleEditInsignia}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newInsignia.nombre}
                  onChange={(e) => setNewInsignia({...newInsignia, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newInsignia.descripcion}
                  onChange={(e) => setNewInsignia({...newInsignia, descripcion: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Imagen (opcional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <small>Deja vacío para mantener la imagen actual</small>
              </div>
              <div className="modal-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInsignia(null);
                    setNewInsignia({ nombre: '', descripcion: '', imagen: null });
                  }}
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

export default GestionarInsignias; 
