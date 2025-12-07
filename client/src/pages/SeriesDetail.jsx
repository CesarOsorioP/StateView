// src/components/SeriesDetail.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaEye, FaRegEye,
  FaBookmark, FaRegBookmark
} from 'react-icons/fa';
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
        const response = await api.get(`/api/serie/${seriesId}`);
        setSeries(response.data);
        const userId = localStorage.getItem('userId');
        if (userId) {
          // Historial (vista)
          const historialResponse = await api.get(`/api/persona/${userId}/historial`);
          const historialData = Array.isArray(historialResponse.data.data) ? historialResponse.data.data : [];
          const isWatched = historialData.some(item => item.contenido_id === seriesId && item.tipo === 'Serie');
          setWatched(isWatched);
          // Me gusta
          const megustaResponse = await api.get(`/api/persona/${userId}/megusta`);
          const megustaData = Array.isArray(megustaResponse.data.data) ? megustaResponse.data.data : [];
          const isLiked = megustaData.some(item => item.contenido_id === seriesId && item.tipo === 'Serie');
          setLiked(isLiked);
        }
      } catch (error) {
        console.error("Error fetching series details:", error);
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchSeriesDetail();
  }, [seriesId]);

  const handleWatchedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!watched) {
        await api.post(`/api/persona/${userId}/historial`, { contenido_id: seriesId, tipo: 'Serie' });
      } else {
        await api.delete(`/api/persona/${userId}/historial`, { data: { contenido_id: seriesId, tipo: 'Serie' } });
      }
      setWatched(!watched);
    } catch (error) {
      setWatched(watched);
    }
  };

  const handleLikedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!liked) {
        await api.post(`/api/persona/${userId}/megusta`, { contenido_id: seriesId, tipo: 'Serie' });
      } else {
        await api.delete(`/api/persona/${userId}/megusta`, { data: { contenido_id: seriesId, tipo: 'Serie' } });
      }
      setLiked(!liked);
    } catch (error) {
      setLiked(liked);
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
              <p><strong>Creador: </strong>{series.creadores}</p>
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
                    onClick={handleLikedToggle}
                    title={liked ? "Quitar me gusta" : "Me gusta"}
                  >
                    {liked ? <FaHeart /> : <FaRegHeart />}
                    <span>{liked ? "Me gusta" : "Me gusta"}</span>
                  </button>
                  
                  <button 
                    className={`action-button ${watched ? 'active' : ''}`}
                    onClick={handleWatchedToggle}
                    title={watched ? "Marcar como no vista" : "Marcar como vista"}
                  >
                    <FaEye />
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
