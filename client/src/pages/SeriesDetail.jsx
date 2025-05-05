import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaTv
} from 'react-icons/fa';
import ReviewSection from '../components/Albumes/ReviewSection';
import "./pageStyles/SeriesDetail.css";

const SeriesDetail = () => {
  const { seriesId } = useParams();
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // Estados para "me gusta" y "ya vista"
  const [liked, setLiked] = useState(false);
  const [watched, setWatched] = useState(false);

  // Obtener detalles de la serie
  useEffect(() => {
    const fetchSeriesDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/series/${seriesId}`);
        setSeries(response.data);
        
        // Verificar si el usuario tiene marcado como "me gusta" o "ya vista"
        if (user) {
          try {
            const userPrefsResponse = await axios.get(
              `http://localhost:5000/api/seriesPreferences/${seriesId}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (userPrefsResponse.data) {
              setLiked(userPrefsResponse.data.liked || false);
              setWatched(userPrefsResponse.data.watched || false);
            }
          } catch (error) {
            console.error("Error fetching user preferences:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching series details:", error);
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchSeriesDetail();
  }, [seriesId, user]);

  // Función para actualizar "me gusta" y "ya vista"
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
      } else if (type === 'watched') {
        updatedValue = !watched;
        setWatched(updatedValue);
      }

      await axios.post(
        `http://localhost:5000/api/seriesPreferences/${seriesId}`,
        { [type]: updatedValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error(`Error updating ${type} preference:`, error);
      // Revertir el cambio visual en caso de error
      if (type === 'liked') setLiked(!liked);
      else if (type === 'watched') setWatched(!watched);
    }
  };

  return (
    <div className="series-detail-page">
      {loadingSeries ? (
        <p>Cargando detalles de la serie...</p>
      ) : series ? (
        <div className="series-info">
          <img src={series.imagen} alt={series.titulo} className="series-cover" />
          <div className="series-meta">
            <h2>{series.titulo}</h2>
            <p><strong>Creador: </strong>{series.creador}</p>
            <p><strong>Plataformas: </strong>{series.plataformas}</p>
            <p><strong>Género: </strong>{series.genero}</p>
            <p><strong>Temporadas: </strong>{series.temporadas}</p>
            <p>
              <strong>Fecha de estreno: </strong>
              {new Date(series.fecha_estreno).toLocaleDateString("es-ES", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            {/* Botones de Me gusta y Ya vista */}
            {user && (
              <div className="series-actions">
                <button 
                  className={`action-button ${liked ? 'active' : ''}`}
                  onClick={() => handlePreferenceToggle('liked')}
                  title={liked ? "Quitar me gusta" : "Me gusta"}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{liked ? "Me gusta" : "Me gusta"}</span>
                </button>
                
                <button 
                  className={`action-button ${watched ? 'active' : ''}`}
                  onClick={() => handlePreferenceToggle('watched')}
                  title={watched ? "Marcar como no vista" : "Marcar como vista"}
                >
                  <FaTv />
                  <span>{watched ? "Vista" : "Marcar como vista"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Serie no encontrada</p>
      )}

      <hr />

      {/* Componente ReviewSection que maneja toda la lógica de reseñas */}
      {series && <ReviewSection seriesId={seriesId} series={series} />}
    </div>
  );
};

export default SeriesDetail;