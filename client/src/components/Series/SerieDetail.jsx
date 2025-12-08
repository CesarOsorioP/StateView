import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import ReviewSection from '../Peliculas/ReviewSection';
import './SerieDetail.css';

const SerieDetail = () => {
  const { id } = useParams();
  const [serie, setSerie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSerie = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/serie/${id}`);
      setSerie(response.data);
    } catch (err) {
      console.error("Error fetching serie details:", err);
      setError("No se pudo cargar la información de la serie.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSerie();
  }, [fetchSerie]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!serie) return <div className="error">Serie no encontrada</div>;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="poster-wrapper">
            <img src={serie.poster} alt={serie.titulo} className="detail-poster" />
        </div>
        <div className="detail-info">
            <h1>{serie.titulo}</h1>
            <div className="meta-data">
                <span>{serie.fechaInicio ? serie.fechaInicio.substring(0, 4) : ''} - {serie.fechaFinal ? serie.fechaFinal.substring(0, 4) : 'Presente'}</span>
                <span>{serie.genero}</span>
            </div>
            <p className="synopsis">{serie.sinopsis}</p>
        </div>
      </div>

      <div className="reviews-container-wrapper">
        <ReviewSection 
            itemId={serie._id} 
            itemData={serie} 
            onModel="Serie" 
        />
      </div>
    </div>
  );
};

export default SerieDetail;
