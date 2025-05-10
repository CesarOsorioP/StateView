import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaHeadphones
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
        setAlbum(response.data);
        
        // Verificar si el usuario tiene marcado como "me gusta" o "ya escuchado"
        if (user) {
          try {
            const userPrefsResponse = await api.get(
              `/api/albumPreferences/${albumId}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (userPrefsResponse.data) {
              setLiked(userPrefsResponse.data.liked || false);
              setListened(userPrefsResponse.data.listened || false);
            }
          } catch (error) {
            console.error("Error fetching user preferences:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching album details:", error);
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
        `/api/albumPreferences/${albumId}`,
        { [type]: updatedValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error(`Error updating ${type} preference:`, error);
      // Revertir el cambio visual en caso de error
      if (type === 'liked') setLiked(!liked);
      else if (type === 'listened') setListened(!listened);
    }
  };

  return (
    <div className="album-detail-page">
      {loadingAlbum ? (
        <p>Cargando detalles del álbum...</p>
      ) : album ? (
        <div className="album-info">
          <img src={album.portada} alt={album.nombre} className="album-cover" />
          <div className="album-meta">
            <h2>{album.nombre}</h2>
            <p><strong>Artista: </strong>{album.artista?.nombre}</p>
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
                  title={liked ? "Quitar me gusta" : "Me gusta"}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{liked ? "Me gusta" : "Me gusta"}</span>
                </button>
                
                <button 
                  className={`action-button ${listened ? 'active' : ''}`}
                  onClick={() => handlePreferenceToggle('listened')}
                  title={listened ? "Marcar como no escuchado" : "Marcar como escuchado"}
                >
                  <FaHeadphones />
                  <span>{listened ? "Escuchado" : "Marcar como escuchado"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Álbum no encontrado</p>
      )}

      <hr />

      {/* Componente ReviewSection que maneja toda la lógica de reseñas */}
      {album && <ReviewSection albumId={albumId} album={album} />}
    </div>
  );
};

export default AlbumDetail;