import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaHeadphones, FaCheck
} from 'react-icons/fa';
import ReviewSection from '../components/Peliculas/ReviewSection';
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
        const response = await api.get(`/api/album/${albumId}`);
        // Acceder correctamente a los datos del álbum
        if (response.data && response.data.data) {
          setAlbum(response.data.data);
          // Obtener estado de botones usando los endpoints correctos
          const userId = localStorage.getItem('userId');
          if (userId) {
            // Estado de escuchado
            try {
              const historialResponse = await api.get(`/api/persona/${userId}/historial`);
              const historialData = Array.isArray(historialResponse.data.data) ? historialResponse.data.data : [];
              const isListened = historialData.some(item => item.contenido_id === (response.data.data._id || albumId) && item.tipo === 'Album');
              setListened(isListened);
            } catch (e) { setListened(false); }
            // Estado de me gusta
            try {
              const megustaResponse = await api.get(`/api/persona/${userId}/megusta`);
              const megustaData = Array.isArray(megustaResponse.data.data) ? megustaResponse.data.data : [];
              const isLiked = megustaData.some(item => item.contenido_id === (response.data.data._id || albumId) && item.tipo === 'Album');
              setLiked(isLiked);
            } catch (e) { setLiked(false); }
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

  // Botón de escuchado
  const handleListenedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!listened) {
        await api.post(`/api/persona/${userId}/historial`, { contenido_id: album._id || albumId, tipo: 'Album' });
      } else {
        await api.delete(`/api/persona/${userId}/historial`, { data: { contenido_id: album._id || albumId, tipo: 'Album' } });
      }
      setListened(!listened);
    } catch (error) {
      setListened(listened);
    }
  };

  // Botón de me gusta
  const handleLikedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!liked) {
        await api.post(`/api/persona/${userId}/megusta`, { contenido_id: album._id || albumId, tipo: 'Album' });
      } else {
        await api.delete(`/api/persona/${userId}/megusta`, { data: { contenido_id: album._id || albumId, tipo: 'Album' } });
      }
      setLiked(!liked);
    } catch (error) {
      setLiked(liked);
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
                  onClick={handleLikedToggle}
                  aria-label={liked ? "Quitar me gusta" : "Me gusta"}
                  title={liked ? "Quitar me gusta" : "Me gusta"}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{liked ? "Me gusta" : "Me gusta"}</span>
                </button>
                
                <button 
                  className={`action-button ${listened ? 'active' : ''}`}
                  onClick={handleListenedToggle}
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
      {album && <ReviewSection itemId={album._id || albumId} itemData={album} onModel="Album" />}
    </div>
  );
};

export default AlbumDetail;