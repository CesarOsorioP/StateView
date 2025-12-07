import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/api';
import './Listas.css';

const Listas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLista, setNewLista] = useState({
    nombre: '',
    descripcion: '',
    esPublica: true
  });

  // Cargar listas del usuario
  useEffect(() => {
    const fetchListas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }

        const response = await api.get(`/api/listas/usuario/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.success && response.data.data) {
          setListas(response.data.data);
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (err) {
        setError('Error al cargar las listas: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchListas();
    }
  }, [user]);

  // Manejar cambios en el formulario de nueva lista
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLista(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Crear nueva lista
  const handleCreateLista = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const listaData = {
        ...newLista,
        creador: user._id
      };

      const response = await api.post('/api/listas', listaData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success && response.data.data) {
        setListas(prev => [...prev, response.data.data]);
        setShowCreateModal(false);
        setNewLista({
          nombre: '',
          descripcion: '',
          esPublica: true
        });
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err) {
      setError('Error al crear la lista: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Eliminar lista
  const handleDeleteLista = async (listaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta lista?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      await api.delete(`/api/listas/${listaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setListas(prev => prev.filter(lista => lista._id !== listaId));
    } catch (err) {
      setError('Error al eliminar la lista: ' + (err.response?.data?.error || err.message));
    }
  };

  // Cambiar visibilidad de la lista
  const handleToggleVisibility = async (listaId, currentVisibility) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await api.put(`/api/listas/${listaId}/visibilidad`, 
        { esPublica: !currentVisibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.data) {
        setListas(prev => prev.map(lista => 
          lista._id === listaId ? response.data.data : lista
        ));
      }
    } catch (err) {
      setError('Error al cambiar la visibilidad: ' + (err.response?.data?.error || err.message));
    }
  };

  // Navegar al detalle de la lista
  const handleListaClick = (listaId) => {
    navigate(`/listas/${listaId}`);
  };

  if (loading) {
    return <div className="loading">Cargando listas...</div>;
  }

  return (
    <div className="listas-container">
      <div className="listas-header">
        <h2>Mis Listas</h2>
        <button 
          className="create-lista-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Crear Nueva Lista
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="listas-grid">
        {listas.map(lista => (
          <div key={lista._id} className="lista-card">
            <div className="lista-header">
              <h3 onClick={() => handleListaClick(lista._id)} style={{ cursor: 'pointer' }}>{lista.nombre}</h3>
              <div className="lista-actions">
                <button
                  className={`visibility-btn ${lista.esPublica ? 'public' : 'private'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(lista._id, lista.esPublica);
                  }}
                  title={lista.esPublica ? 'Hacer privada' : 'Hacer pública'}
                >
                  {lista.esPublica ? '🌐' : '🔒'}
                </button>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLista(lista._id);
                  }}
                  title="Eliminar lista"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="lista-description" onClick={() => handleListaClick(lista._id)} style={{ cursor: 'pointer' }}>
              {lista.descripcion || 'Sin descripción'}
            </p>
            <div className="lista-stats" onClick={() => handleListaClick(lista._id)} style={{ cursor: 'pointer' }}>
              <span>{lista.elementos?.length || 0} elementos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para crear nueva lista */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Crear Nueva Lista</h3>
            <form onSubmit={handleCreateLista}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={newLista.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="descripcion">Descripción:</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={newLista.descripcion}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="esPublica"
                    checked={newLista.esPublica}
                    onChange={handleInputChange}
                  />
                  Lista pública
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Crear Lista</button>
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
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

export default Listas;