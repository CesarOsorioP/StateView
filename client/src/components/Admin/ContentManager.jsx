
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './ContentManagement.css';

const ContentManager = () => {
  const { user } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState('peliculas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mapeo de tipos de contenido a endpoints
  const contentEndpoints = {
    peliculas: 'peliculas',
    series: 'series',
    videojuegos: 'videojuegos',
    albums: 'albums'
  };

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Cargar contenido inicial al montar el componente o cuando cambia el tipo
  useEffect(() => {
    fetchContent();
  }, [contentType]);

  // Función para obtener el contenido
  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/${contentEndpoints[contentType]}`);
      
      // Verificar si la respuesta tiene datos directamente o dentro de una propiedad 'data'
      const contentData = res.data.data || res.data;
      
      // Asegurarnos de que tenemos un array y procesar cualquier objeto anidado
      let processedData = Array.isArray(contentData) ? contentData : [];
      
      // Log para depuración
      console.log(`Datos recibidos para ${contentType}:`, processedData);
      
      // Asegurar que cada elemento tenga un _id para la eliminación
      processedData = processedData.map(item => {
        // Si no tiene _id, usar alguna de las alternativas de ID según el tipo
        if (!item._id) {
          if (contentType === 'albums' && item.album_id) {
            item._id = item.album_id;
          } else if (contentType === 'peliculas' && item.pelicula_id) {
            item._id = item.pelicula_id;
          } else if (contentType === 'series' && item.serie_id) {
            item._id = item.serie_id;
          } else if (contentType === 'videojuegos' && item.juego_id) {
            item._id = item.juego_id;
          }
        }
        return item;
      });
      
      setContent(processedData);
      setError('');
    } catch (error) {
      console.error('Error fetching content:', error);
      setError(`Error al cargar ${contentType}. Por favor, intenta de nuevo.`);
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en el tipo de contenido
  const handleContentTypeChange = (e) => {
    setContentType(e.target.value);
    setSearchQuery('');
    setSuccess('');
    setError('');
  };

  // Manejar cambio en la búsqueda
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Función para agregar nuevo contenido
  const handleAddContent = async () => {
    if (!searchQuery.trim()) {
      setError(`Por favor, ingresa un ${contentType === 'albums' ? 'artista y álbum' : 'título'} para buscar.`);
      return;
    }

    setRefreshing(true);
    setError('');
    setSuccess('');
    
    try {
      let endpoint;
      
      // Preparar la URL según el tipo de contenido
      if (contentType === 'albums') {
        // Para álbumes, necesitamos parsear artista y álbum
        const [artist, album] = searchQuery.split(' - ');
        if (!artist || !album) {
          throw new Error('Formato incorrecto. Usa "Artista - Álbum"');
        }
        endpoint = `${API_BASE_URL}/${contentEndpoints[contentType]}/refresh?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`;
      } else {
        // Para películas, series y videojuegos
        endpoint = `${API_BASE_URL}/${contentEndpoints[contentType]}/refresh?title=${encodeURIComponent(searchQuery)}`;
      }
      
      console.log('Intentando agregar contenido con la URL:', endpoint);
      
      // Realizar la solicitud GET para agregar/refrescar contenido (como en el controlador original)
      const response = await axios.get(endpoint);
      
      if (response.data) {
        await fetchContent(); // Recargar la lista después de agregar
        setSuccess(`${contentType.charAt(0).toUpperCase() + contentType.slice(1, -1)} agregado con éxito.`);
        setSearchQuery('');
      } else {
        setError(response.data.message || `No se pudo agregar el contenido.`);
      }
    } catch (error) {
      console.error('Error adding content:', error);
      setError(error.response?.data?.message || error.message || `Error al agregar ${contentType}. Por favor, intenta de nuevo.`);
    } finally {
      setRefreshing(false);
    }
  };

  // Función para eliminar contenido
  const handleDelete = async (contentId) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar este ${contentType.slice(0, -1)}?`)) {
      setLoading(true);
      
      try {
        // Mapeo de tipos de contenido a nombre del campo ID
        const idFieldMap = {
          albums: 'album_id',
          peliculas: 'pelicula_id',
          series: 'serie_id',
          videojuegos: 'juego_id'
        };
        
        // Encontrar el elemento que queremos eliminar para obtener el ID correcto
        const itemToDelete = content.find(item => item._id === contentId);
        if (!itemToDelete) {
          throw new Error('Elemento no encontrado');
        }
        
        // Obtener el ID específico según el tipo de contenido
        const specificId = itemToDelete[idFieldMap[contentType]] || contentId;
        
        const deleteUrl = `${API_BASE_URL}/${contentEndpoints[contentType]}/${specificId}`;
        
        console.log(`Intentando eliminar ${contentType.slice(0, -1)} con URL:`, deleteUrl);
        
        await axios.delete(deleteUrl);
        
        // Actualizar el estado eliminando el elemento
        setContent((prev) => prev.filter((item) => item._id !== contentId));
        setSuccess(`${contentType.slice(0, -1)} eliminado con éxito`);
      } catch (error) {
        console.error('Error deleting content:', error);
        setError(`Error al eliminar ${contentType.slice(0, -1)}. Por favor, intenta de nuevo.`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para abrir el modal (para futuras implementaciones)
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Si todavía no tenemos el usuario cargado, podemos mostrar un mensaje "Cargando..."
  if (!user) {
    return (
      <div className="content-management-page">
        <div className="loading-block">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Verificar que el usuario tenga permisos (Administrador o Moderador)
  if (user.rol !== 'Superadministrador' && user.rol !== 'Administrador'  && user.rol !== 'Moderador') {
    return (
      <div className="content-management-page">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para ver esta sección. Esta área está restringida a Administradores y Moderadores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-management-page">
      <div className="page-header">
        <h1>Gestión de Contenido</h1>
      </div>
      
      {error && <div className="status-message error-message">{error}</div>}
      {success && <div className="status-message success-message">{success}</div>}
      
      <div className="content-controls">
        <div className="content-type-selector">
          <label htmlFor="contentType">Tipo de Contenido:</label>
          <select
            id="contentType"
            value={contentType}
            onChange={handleContentTypeChange}
            className="content-type-select"
          >
            <option value="peliculas">Películas</option>
            <option value="series">Series</option>
            <option value="videojuegos">Videojuegos</option>
            <option value="albums">Álbumes</option>
          </select>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder={contentType === 'albums' 
              ? "Formato: Artista - Álbum" 
              : `Buscar ${contentType}...`}
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button 
            className="refresh-button"
            onClick={handleAddContent}
            disabled={refreshing}
          >
            {refreshing ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
      
      {loading && !content.length ? (
        <div className="loading-block">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="content-container">
          {content.length === 0 ? (
            <div className="no-content-message">
              <p>No hay {contentType} disponibles. Agrega nuevo contenido utilizando el buscador.</p>
            </div>
          ) : (
            <table className="content-table">
              <thead>
                <tr>
                  <th>Título</th>
                  {contentType === 'albums' && <th>Artista</th>}
                  <th>Año</th>
                  {(contentType === 'peliculas' || contentType === 'series') && <th>Género</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {content.map((item) => (
                  <tr key={item._id}>
                    <td>{item.titulo || (typeof item.nombre === 'string' ? item.nombre : (item.nombre && item.nombre.nombre ? item.nombre.nombre : 'Sin título'))}</td>
                    {contentType === 'albums' && (
                      <td>
                        {typeof item.artista === 'string' 
                          ? item.artista 
                          : (item.artista && item.artista.nombre 
                              ? item.artista.nombre 
                              : 'Artista desconocido')}
                      </td>
                    )}
                    <td>{item.año || (item.fechaLanzamiento && item.fechaLanzamiento.substring(0, 4)) || 'N/A'}</td>
                    {(contentType === 'peliculas' || contentType === 'series') && (
                      <td>{Array.isArray(item.genero) ? item.genero.join(', ') : (item.genero || 'N/A')}</td>
                    )}
                    <td>
                      <button 
                        className="action-button3 delete" 
                        onClick={() => handleDelete(item._id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal para funcionalidades futuras */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detalles del Contenido</h2>
              <button 
                className="close-modal-button" 
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="modal-body">
              <p>Funcionalidad en desarrollo...</p>
            </div>
            
            <div className="modal-footer">
              <button onClick={closeModal} className="modal-button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;