import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/api';
import './ListaDetalle.css';

const ListaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lista, setLista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchLista = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }

        const response = await api.get(`/api/listas/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLista(response.data.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar la lista');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLista();
  }, [id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await api.get(`/api/contenido/buscar?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setSearchResults(response.data.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err) {
      console.error('Error en la búsqueda:', err);
      setError('Error al buscar contenido');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddElement = async (contenido) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // El backend espera tipos en minúsculas: 'pelicula', 'serie', 'videojuego', 'album'
      // El API de búsqueda devuelve: 'pelicula', 'serie', 'videojuego', 'album'
      // Así que usamos directamente el tipo del contenido
      const tipoBackend = contenido.type;

      console.log('Agregando elemento:', {
        tipo: tipoBackend,
        contenidoId: contenido._id,
        listaId: id
      });

      const response = await api.post(`/api/listas/${id}/elementos`, {
        tipo: tipoBackend,
        contenido: contenido._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLista(response.data.data);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error al agregar elemento:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error al agregar el elemento a la lista';
      console.error('Detalles del error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      alert(errorMessage);
    }
  };

  const handleRemoveElement = async (elementoId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await api.delete(`/api/listas/${id}/elementos/${elementoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLista(response.data.data);
      } else {
        alert('Error al eliminar el elemento');
      }
    } catch (err) {
      console.error('Error al eliminar elemento:', err);
      alert(err.response?.data?.error || 'Error al eliminar el elemento');
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await api.put(`/api/listas/${id}/visibilidad`, {
        esPublica: !lista.esPublica
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLista(prevLista => ({
        ...prevLista,
        esPublica: response.data.data.esPublica
      }));
    } catch (err) {
      console.error('Error al cambiar visibilidad:', err);
    }
  };

  const getImageUrl = (elemento) => {
    // Si es un elemento denormalizado con campos directos
    if (elemento.imagen) return elemento.imagen;
    if (elemento.poster) return elemento.poster;
    if (elemento.portada) return elemento.portada;
    
    // Si tiene contenido anidado
    const contenido = elemento.contenido || elemento;
    if (contenido.poster) return contenido.poster;
    if (contenido.portada) return contenido.portada;
    if (contenido.imagen) return contenido.imagen;
    
    // Placeholder por defecto
    return '/placeholder-image.jpg';
  };

  const getTitulo = (elemento) => {
    if (elemento.titulo) return elemento.titulo;
    const contenido = elemento.contenido || elemento;
    return contenido.titulo || contenido.nombre || 'Sin título';
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!lista) {
    return <div className="error-message">Lista no encontrada</div>;
  }

  return (
    <div className="lista-detalle-container">
      <div className="lista-detalle-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h2>{lista.nombre}</h2>
        <button className="add-content-btn" onClick={() => setShowSearchModal(true)}>
          Agregar Contenido
        </button>
      </div>

      <div className="lista-info">
        <p className="lista-description">{lista.descripcion}</p>
        <div className="lista-stats">
          <span>{lista.elementos.length} elementos</span>
          <div className="visibility-status">
            <span>{lista.esPublica ? 'Pública' : 'Privada'}</span>
            {user && user._id === lista.creador._id && (
              <button 
                className={`visibility-btn ${lista.esPublica ? 'public' : 'private'}`}
                onClick={handleToggleVisibility}
              >
                {lista.esPublica ? '🌐' : '🔒'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="elementos-grid">
        {lista.elementos.map((elemento, index) => (
          <div key={elemento._id || `elemento-${index}`} className="elemento-card">
            <img
              src={getImageUrl(elemento)}
              alt={getTitulo(elemento)}
              className="elemento-imagen"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />
            <div className="elemento-info">
              <h3>{getTitulo(elemento)}</h3>
              <p>{elemento.tipo || elemento.tipoModelo || 'Contenido'}</p>
            </div>
            {user && lista.creador && (user._id === lista.creador._id || user._id === lista.creador) && (
              <button
                className="remove-element-btn"
                onClick={() => handleRemoveElement(elemento._id)}
                title="Eliminar de la lista"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {showSearchModal && (
        <div className="modal-overlay">
          <div className="search-modal">
            <div className="modal-header">
              <h3>Buscar Contenido</h3>
              <button
                className="close-modal-button"
                onClick={() => setShowSearchModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setHasSearched(false);
                  }
                }}
                placeholder="Buscar películas, series, juegos o álbumes..."
              />
              <button type="submit" className="search-button">
                Buscar
              </button>
            </form>

            {searchLoading ? (
              <div className="loading">Buscando...</div>
            ) : (
              <div className="search-results">
                {searchResults
                  .filter(result => 
                    (result.type === 'pelicula' || result.type === 'serie' || result.type === 'videojuego' || result.type === 'album') && 
                    (result.titulo || result.nombre)
                  )
                  .map((result) => (
                    <div key={result._id} className="search-result-item">
                      <img
                        src={getImageUrl(result)}
                        alt={result.titulo || result.nombre}
                        className="elemento-imagen"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="elemento-info">
                        <h3>{result.titulo || result.nombre}</h3>
                        <p>
                          {result.type === 'pelicula' ? 'Película' : 
                           result.type === 'serie' ? 'Serie' : 
                           result.type === 'videojuego' ? 'Videojuego' : 
                           result.type === 'album' ? 'Álbum' : result.type}
                        </p>
                        {result.artista && <p>Artista: {result.artista.nombre}</p>}
                      </div>
                      <button
                        className="add-element-btn"
                        onClick={() => handleAddElement(result)}
                        title="Agregar a la lista"
                      >
                        +
                      </button>
                    </div>
                  ))}
                {searchResults.filter(result => 
                  (result.type === 'pelicula' || result.type === 'serie' || result.type === 'videojuego' || result.type === 'album') && 
                  (result.titulo || result.nombre)
                ).length === 0 && searchQuery.trim() && !searchLoading && hasSearched && (
                  <div className="no-results-message">No se encontraron resultados para "{searchQuery}".</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaDetalle; 