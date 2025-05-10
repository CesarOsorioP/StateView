// src/components/SeriesDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaRegHeart, FaTv } from 'react-icons/fa';
import ReviewSection from '../components/Series/ReviewSection';
import "./pageStyles/SeriesDetail.css";
import api from '../api/api';

const SeriesDetail = () => {
  const { seriesId } = useParams();
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // Estados para "me gusta" y "ya vista"
  const [liked, setLiked] = useState(false);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    const fetchSeriesDetail = async () => {
      try {
        const response = await api.get(`/api/series/${seriesId}`);
        setSeries(response.data);
        
        // Verificar si el usuario tiene marcado "me gusta" o "ya vista"
        if (user) {
          try {
            const userPrefsResponse = await api.get(
              `/api/seriesPreferences/${seriesId}`,
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

      await api.post(
        `/api/seriesPreferences/${seriesId}`,
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
        <>
          <div className="series-info">
            <img src={series.poster} alt={series.titulo} className="series-cover" />
            <div className="series-meta">
              <h2>{series.titulo}</h2>
              <p><strong>Creador: </strong>{series.creador}</p>
              <p><strong>Plataformas: </strong>{series.plataformas}</p>
              <p><strong>Género: </strong>{series.genero}</p>
              
              {/* Mostrar la cantidad de temporadas */}
              <p><strong>Temporadas: </strong>{series.temporadas.length}</p>
              
              {/* Alternativamente, iterar sobre el arreglo para listar detalles de cada temporada */}
              <div>
                <strong>Listado de Temporadas:</strong>
                <ul>
                  {series.temporadas.map((temporada) => (
                    <li key={temporada._id}>
                      Temporada {temporada.temporada_numero} — {temporada.episodios ? temporada.episodios.length : 0} episodios
                    </li>
                  ))}
                </ul>
              </div>
              
              <p>
                <strong>Fecha de estreno: </strong>
                {new Date(series.fechaInicio).toLocaleDateString("es-ES", {
                  year: 'numeric'
                
                })}
              </p>
              
              {/* Botones de "Me gusta" y "Marcar como vista" para usuarios logueados */}
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
          <hr />
          {/* Componente de reseñas */}
          <ReviewSection seriesId={seriesId} series={series} />
        </>
      ) : (
        <p>Serie no encontrada</p>
      )}
    </div>
  );
};

export default SeriesDetail;
