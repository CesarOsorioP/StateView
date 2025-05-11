import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaHeadphones, FaCheck
} from 'react-icons/fa';
import ReviewSection from '../components/Albumes/ReviewSection';
import "./pageStyles/AlbumDetail.css";
import api from '../api/api';

const AlbumDetail = () => {
  const { albumId } = useParams();
  const { user } = useAuth();
  const [album, setAlbum] = useState(null);
  const [loadingAlbum, setLoadingAlbum] = useState(true);

  // Estados para "me gusta" y "ya escuchado"
  const [liked, setLiked] = useState(false);
  const [listened, setListened] = useState(false);

  // Obtener detalles del álbum
  useEffect(() => {
    const fetchAlbumDetail = async () => {
      try {
        const response = await api.get(`/api/albums/${albumId}`);
        // Acceder correctamente a los datos del álbum
        if (response.data && response.data.data) {
          setAlbum(response.data.data);
          console.log("Datos del álbum recibidos:", response.data.data);

          // Verificar si el usuario tiene marcado como "me gusta" o "ya escuchado"
          if (user) {
            try {
              const userPrefsResponse = await api.get(
                `/api/albums/${albumId}/preferences`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
              );
              if (userPrefsResponse.data && userPrefsResponse.data.data) {
                setLiked(userPrefsResponse.data.data.liked || false);
                setListened(userPrefsResponse.data.data.listened || false);
              }
            } catch (error) {
              console.error("Error fetching user preferences:", error);
              // No mostrar error al usuario si falla la carga de preferencias
              setLiked(false);
              setListened(false);
            }
          }
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (error) {
        console.error("Error fetching album details:", error);
        setAlbum(null);
      } finally {
        setLoadingAlbum(false);
      }
    };

    fetchAlbumDetail();
  }, [albumId, user]);

  // Función para actualizar "me gusta" y "ya escuchado"
  const handlePreferenceToggle = async (type) => {
    if (!user) {
      alert("Debes iniciar sesión para realizar esta acción.");
      return;
    }

    try {
      let updatedValue;
      if (type === 'liked') {
        updatedValue = !liked;
        setLiked(updatedValue);
      } else if (type === 'listened') {
        updatedValue = !listened;
        setListened(updatedValue);
      }

      await api.post(
        `/api/albums/${albumId}/preferences`,
        { [type]: updatedValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error(`Error updating ${type} preference:`, error);
      // Revertir el cambio visual en caso de error
      if (type === 'liked') setLiked(!liked);
      else if (type === 'listened') setListened(!listened);
      
      // Mostrar mensaje de error al usuario
      alert(`No se pudo actualizar la preferencia. Por favor, intenta de nuevo más tarde.`);
    }
  };

  return (
    <div className="album-detail-page">
      {loadingAlbum ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando detalles del álbum...</p>
        </div>
      ) : album ? (
        <div className="album-info">
          <div className="album-cover-container">
            <img 
              src={album.portada} 
              alt={album.nombre} 
              className="album-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>
          <div className="album-meta">
            <h2>{album.nombre}</h2>
            <p><strong>Artista: </strong>{album.artista?.nombre || 'Desconocido'}</p>
            <p>
              <strong>Fecha de estreno: </strong>
              {new Date(album.fecha_estreno).toLocaleDateString("es-ES", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            {/* Botones de Me gusta y Ya escuchado */}
            {user && (
              <div className="album-actions">
                <button 
                  className={`action-button ${liked ? 'active' : ''}`}
                  onClick={() => handlePreferenceToggle('liked')}
                  aria-label={liked ? "Quitar me gusta" : "Me gusta"}
                  title={liked ? "Quitar me gusta" : "Me gusta"}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{liked ? "Me gusta" : "Me gusta"}</span>
                </button>
                
                <button 
                  className={`action-button ${listened ? 'active' : ''}`}
                  onClick={() => handlePreferenceToggle('listened')}
                  aria-label={listened ? "Marcar como no escuchado" : "Marcar como escuchado"}
                  title={listened ? "Marcar como no escuchado" : "Marcar como escuchado"}
                >
                  {listened ? <FaCheck /> : <FaHeadphones />}
                  <span>{listened ? "Escuchado" : "Marcar como escuchado"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="error-container">
          <h2>Error</h2>
          <p>No se pudo cargar la información del álbum</p>
        </div>
      )}

      <hr />

      {/* Componente ReviewSection que maneja toda la lógica de reseñas */}
      {album && <ReviewSection albumId={albumId} album={album} />}
    </div>
  );
};

export default AlbumDetail;