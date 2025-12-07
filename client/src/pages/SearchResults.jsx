import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import '../styles/SearchResults.css';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await api.get(`/api/contenido/buscar?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('API Response:', response.data);
        setResults(Array.isArray(response.data.data) ? response.data.data : 
                  Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Error al buscar resultados. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
  }, [query]);

  // Función para manejar la navegación al hacer click en una card
  const handleCardClick = (item) => {
    if (!item) return;

    // Determinar el tipo de contenido y navegar a la vista correspondiente
    const type = (item.tipo || item.type || '').toLowerCase();
    
    // Obtener el ID correcto según el tipo de contenido
    let id;
    switch (type) {
      case 'pelicula':
        id = item.imdbID || item.pelicula_id;
        break;
      case 'serie':
        id = item.imdbID || item.serie_id;
        break;
      case 'videojuego':
        id = item.rawgId || item.juego_id;
        break;
      case 'album':
        id = item.mbid || item.album_id;
        break;
      case 'usuario':
        id = item.nombre;
        break;
      default:
        console.warn('Tipo de contenido no reconocido:', type);
        return;
    }

    // Si no tenemos el ID externo, no navegamos
    if (!id) {
      console.warn('No se encontró el ID externo para el contenido:', item);
      return;
    }

    // Navegar a la ruta correspondiente
    switch (type) {
      case 'pelicula':
        navigate(`/pelicula/${id}`);
        break;
      case 'serie':
        navigate(`/serie/${id}`);
        break;
      case 'videojuego':
        navigate(`/videojuego/${id}`);
        break;
      case 'album':
        navigate(`/album/${id}`);
        break;
      case 'usuario':
        navigate(`/perfil/${id}`);
        break;
      default:
        console.warn('Tipo de contenido no reconocido:', type);
    }
  };

  // Función para obtener el tipo de contenido en español
  const getContentTypeLabel = (type) => {
    switch (type.toLowerCase()) {
      case 'pelicula':
        return 'Películas';
      case 'serie':
        return 'Series';
      case 'videojuego':
        return 'Videojuegos';
      case 'album':
        return 'Álbumes';
      case 'usuario':
        return 'Usuarios';
      default:
        return type;
    }
  };

  // Función para obtener la URL de la imagen
  const getImageUrl = (item) => {
    if (!item) return '';
    
    // Intentar obtener la imagen según el tipo de contenido
    switch ((item.tipo || item.type || '').toLowerCase()) {
      case 'pelicula':
        return item.poster || item.imagen || item.portada || '';
      case 'serie':
        return item.poster || item.imagen || item.portada || '';
      case 'videojuego':
        return item.background_image || item.imagen || item.portada || '';
      case 'album':
        return item.portada || item.cover_image || item.imagen || '';
      case 'usuario':
        return item.imagenPerfil || '';
      default:
        return item.imagen || item.portada || '';
    }
  };

  // Función para obtener el título
  const getTitle = (item) => {
    if (!item) return '';
    
    // Intentar obtener el título según el tipo de contenido
    switch ((item.tipo || item.type || '').toLowerCase()) {
      case 'pelicula':
        return item.title || item.titulo || item.nombre || '';
      case 'serie':
        return item.name || item.titulo || item.nombre || '';
      case 'videojuego':
        return item.name || item.titulo || item.nombre || '';
      case 'album':
        return item.title || item.titulo || item.nombre || '';
      case 'usuario':
        return item.nombre || '';
      default:
        return item.nombre || item.titulo || '';
    }
  };

  // Agrupar resultados por tipo
  const groupedResults = results.reduce((acc, result) => {
    if (!result) return acc;
    const type = (result.tipo || result.type || 'Otros').toLowerCase();
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(result);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Buscando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results-page">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <p>Por favor, intenta de nuevo más tarde.</p>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="search-results-page">
        <div className="search-results-header">
          <h1>Resultados de búsqueda</h1>
          <p>No se encontraron resultados para "{query}"</p>
        </div>
        <div className="no-results">
          <h2>No hay resultados</h2>
          <p>Intenta con otros términos de búsqueda o explora nuestras categorías.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-results-header">
        <h1>Resultados de búsqueda</h1>
        <p>Resultados para "{query}"</p>
      </div>

      {Object.entries(groupedResults).map(([type, items]) => (
        <div key={type} className="results-section">
          <h2 className="section-title">
            {getContentTypeLabel(type)}
          </h2>
          <div className="results-grid">
            {items.map((item, index) => (
              <div 
                key={item._id || index} 
                className="result-card"
                onClick={() => handleCardClick(item)}
              >
                <div className="result-image-container">
                  <img 
                    src={getImageUrl(item)} 
                    alt={getTitle(item)} 
                    className="result-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                </div>
                <div className="result-info">
                  <h3 className="result-title">{getTitle(item)}</h3>
                  <span className={`result-type ${type}`}>
                    {getContentTypeLabel(type)}
                  </span>
                  {item.rol && (
                    <span className="result-role">
                      {item.rol}
                    </span>
                  )}
                  {item.descripcion && (
                    <p className="result-description">{item.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults; 