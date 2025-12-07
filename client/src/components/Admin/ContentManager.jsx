import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { FaSearch, FaPlus, FaTrash, FaFilm, FaTv, FaGamepad, FaMusic } from 'react-icons/fa';
import './ContentManagement.css';

const ContentManager = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('peliculas');
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState(null);

  const tabs = [
    { id: 'peliculas', label: 'Películas', icon: <FaFilm /> },
    { id: 'series', label: 'Series', icon: <FaTv /> },
    { id: 'videojuegos', label: 'Videojuegos', icon: <FaGamepad /> },
    { id: 'albums', label: 'Álbumes', icon: <FaMusic /> }
  ];

      // Configuración por tipo de contenido
      const config = {
        peliculas: {
          endpoint: 'pelicula',
          searchEndpoint: '/api/pelicula/search-omdb',
          addEndpoint: '/api/pelicula/add-by-id',
          idField: 'pelicula_id',
          titleField: 'titulo',
          imageField: 'imagen',
          yearField: 'fecha_estreno'
        },
        series: {
          endpoint: 'serie',
          searchEndpoint: '/api/serie/search-omdb',
          addEndpoint: '/api/serie/add-by-id',
          idField: 'serie_id',
          titleField: 'titulo',
          imageField: 'poster',
          yearField: 'fechaInicio'
        },
        videojuegos: {
          endpoint: 'videojuego',
          searchEndpoint: '/api/videojuego/search-rawg',
          addEndpoint: '/api/videojuego/add-by-id',
          idField: 'juego_id',
          titleField: 'titulo',
          imageField: 'imagen',
          yearField: 'fecha_lanzamiento'
        },
        albums: {
          endpoint: 'album',
          searchEndpoint: '/api/album/search-lastfm',
          addEndpoint: '/api/album/refresh',
          idField: 'album_id',
          titleField: 'nombre',
          imageField: 'portada',
          yearField: 'fecha_estreno'
        }
      };

  useEffect(() => {
    fetchContent();
    setSearchQuery('');
    setLocalSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [activeTab]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/${config[activeTab].endpoint}`);
      // Manejar diferentes estructuras de respuesta
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setContentList(data);
    } catch (error) {
      console.error('Error al cargar contenido:', error);
      showMessage('error', 'Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await api.get(`${config[activeTab].searchEndpoint}?query=${encodeURIComponent(searchQuery)}`);
      
      if (response.data.success && response.data.data) {
        setSearchResults(response.data.data);
        setShowResults(true);
      } else {
        showMessage('info', 'No se encontraron resultados');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      showMessage('error', 'Error al buscar contenido');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContent = async (item) => {
    try {
      setIsSearching(true); // Usar loading state general o de búsqueda
      const currentConfig = config[activeTab];
      let endpoint = currentConfig.addEndpoint;
      let method = 'GET';
      let data = null;

          // Construir la petición según el tipo
          if (activeTab === 'peliculas') {
            method = 'POST';
            data = { imdbId: item.imdbID };
          } else if (activeTab === 'series') {
            method = 'POST';
            data = { imdbId: item.imdbID };
          } else if (activeTab === 'videojuegos') {
            method = 'POST';
            data = { gameId: item.imdbID }; // El search de RAWG devuelve 'id' mapeado a 'imdbID'
          } else if (activeTab === 'albums') {
            // Asegurarse que artist y album se envíen correctamente
            const artistName = item.Artist || item.artist || (item.artista ? item.artista.nombre : '');
            const albumName = item.Title || item.name || item.nombre;
            endpoint += `?artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}`;
          } else {
            // Fallback (aunque ya cubrimos todos los casos)
            endpoint += `?title=${encodeURIComponent(item.Title || item.titulo || item.name)}`;
          }

      let response;
      if (method === 'POST') {
        response = await api.post(endpoint, data);
      } else {
        response = await api.get(endpoint);
      }

      if (response.data) {
        showMessage('success', 'Contenido agregado exitosamente');
        // Recargar lista y limpiar búsqueda
        fetchContent();
        setShowResults(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error al agregar:', error);
      showMessage('error', 'Error al agregar el contenido');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este contenido?')) return;

    try {
      // Buscar el ítem para obtener su ID específico si es necesario
      // Pero generalmente usamos el _id de mongo o el id específico
      // La lista contentList ya tiene los objetos completos
      const itemToDelete = contentList.find(item => item._id === id);
      // Usar el _id de MongoDB por defecto ya que es lo que espera la ruta delete en general
      const targetId = itemToDelete._id; 

      await api.delete(`/api/${config[activeTab].endpoint}/${targetId}`);
      
      setContentList(prev => prev.filter(item => item._id !== id));
      showMessage('success', 'Contenido eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      showMessage('error', 'Error al eliminar el contenido');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

      const getImageUrl = (item, isSearchResult = false) => {
        // Lógica para obtener imagen dependiendo si es resultado de búsqueda o contenido guardado
        if (isSearchResult) {
            if (activeTab === 'peliculas' || activeTab === 'series') return item.Poster !== 'N/A' ? item.Poster : null;
            if (activeTab === 'videojuegos') return item.background_image || item.poster || item.imagen;
            if (activeTab === 'albums') {
                // Las imágenes de Last.fm pueden venir como array o string directo
                if (item.image && Array.isArray(item.image)) {
                    return item.image[2]?.['#text'] || item.image[3]?.['#text'] || item.image[0]?.['#text'];
                }
                return item.portada || item.image || item.Poster; 
            }
        } else {
            const field = config[activeTab].imageField;
            // Asegurar que para videojuegos se usa el campo correcto
            if (activeTab === 'videojuegos' && !item[field] && item.background_image) {
                return item.background_image;
            }
            return item[field];
        }
        return null;
      };

  const getTitle = (item) => {
    return item.Title || item.name || item.titulo || item.nombre || 'Sin título';
  };

  const getDate = (item) => {
    if (activeTab === 'albums') {
        if (item.fecha_estreno && item.fecha_estreno !== '') return item.fecha_estreno;
        if (item.Year && item.Year !== 'N/A') return item.Year;
    }
    const date = item.Year || item.released?.substring(0, 4) || item.fecha_estreno || item.fecha_lanzamiento || item.fechaInicio;
    return (date && date !== 'N/A') ? date : 'Fecha desconocida';
  };

  if (!user || !['Administrador', 'Superadministrador', 'Moderador'].includes(user.rol)) {
    return <div className="access-denied">Acceso denegado</div>;
  }

  const filteredContent = contentList.filter(item => {
    if (!localSearchQuery) return true;
    const title = getTitle(item).toLowerCase();
    return title.includes(localSearchQuery.toLowerCase());
  });

  const displayedContent = localSearchQuery 
    ? filteredContent 
    : filteredContent.slice(0, 20);

  return (
    <div className="content-manager-container">
      <header className="manager-header">
        <h1>Gestión de Contenido</h1>
        <p>Administra el catálogo de películas, series, videojuegos y álbumes.</p>
      </header>

      {message && (
        <div className={`status-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      <nav className="content-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="manager-actions">
        {/* Buscador externo (para agregar) */}
        <form onSubmit={handleSearch} className="search-bar external-search">
          <input
            type="text"
            placeholder={`Buscar nuevo contenido para AGREGAR en ${tabs.find(t => t.id === activeTab).label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={isSearching}>
            <FaSearch />
          </button>
        </form>
      </div>

      {showResults ? (
        <div className="results-section">
          <div className="section-header">
            <h2>Resultados de la búsqueda externa</h2>
            <button className="close-results" onClick={() => setShowResults(false)}>
              Volver a colección
            </button>
          </div>
          
          <div className="content-list-container">
            {searchResults.map((item, index) => (
              <div key={index} className="content-list-item">
                <div className="item-image">
                  <img 
                    src={getImageUrl(item, true) || '/placeholder-image.png'} 
                    alt={getTitle(item)}
                    onError={(e) => e.target.src = '/placeholder-image.png'}
                  />
                </div>
                <div className="item-details">
                  <h3>{getTitle(item)}</h3>
                  <span className="item-meta">
                    {getDate(item)}
                  </span>
                </div>
                <div className="item-actions">
                  <button 
                    className="add-btn"
                    onClick={() => handleAddContent(item)}
                    disabled={isSearching}
                  >
                    <FaPlus /> Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="collection-section">
          <div className="section-header">
             <h2>Colección Actual ({contentList.length})</h2>
          </div>
          
          {/* Buscador interno (local) */}
          <div className="search-bar local-search" style={{ marginBottom: '1.5rem', maxWidth: '100%' }}>
            <input
              type="text"
              placeholder={`Buscar en tu colección actual de ${tabs.find(t => t.id === activeTab).label.toLowerCase()}...`}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
            />
            <button type="button" style={{ cursor: 'default' }}>
              <FaSearch />
            </button>
          </div>

          {loading ? (
            <div className="loader">Cargando...</div>
          ) : (
            <div className="content-list-container">
              {displayedContent.map((item) => (
                <div key={item._id} className="content-list-item">
                  <div className="item-image">
                    <img 
                      src={getImageUrl(item) || '/placeholder-image.png'} 
                      alt={getTitle(item)}
                      onError={(e) => e.target.src = '/placeholder-image.png'}
                    />
                  </div>
                  <div className="item-details">
                    <h3>{getTitle(item)}</h3>
                    <span className="item-meta">
                      {getDate(item)}
                    </span>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(item._id)}
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {!localSearchQuery && contentList.length > 20 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#777' }}>
                  Mostrando los primeros 20 resultados. Usa el buscador para encontrar más.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentManager;