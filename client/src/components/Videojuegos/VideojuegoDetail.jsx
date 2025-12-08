import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import ReviewSection from '../Peliculas/ReviewSection';
import './VideojuegoDetail.css';

const VideojuegoDetail = () => {
  const { id } = useParams();
  const [videojuego, setVideojuego] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideojuego = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/videojuego/${id}`);
      setVideojuego(response.data);
    } catch (err) {
      console.error("Error fetching videojuego details:", err);
      setError("No se pudo cargar la información del videojuego.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVideojuego();
  }, [fetchVideojuego]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!videojuego) return <div className="error">Videojuego no encontrado</div>;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="poster-wrapper">
            <img src={videojuego.imagen} alt={videojuego.titulo} className="detail-poster" />
        </div>
        <div className="detail-info">
            <h1>{videojuego.titulo}</h1>
            <div className="meta-data">
                <span>{videojuego.fecha_lanzamiento ? new Date(videojuego.fecha_lanzamiento).getFullYear() : ''}</span>
                <span>{videojuego.plataformas}</span>
                <span>{videojuego.desarrollador}</span>
            </div>
            <p className="synopsis">{videojuego.sinopsis}</p>
        </div>
      </div>

      <div className="reviews-container-wrapper">
        <ReviewSection 
            itemId={videojuego._id} 
            itemData={videojuego} 
            onModel="Videojuego" 
        />
      </div>
    </div>
  );
};

export default VideojuegoDetail;
