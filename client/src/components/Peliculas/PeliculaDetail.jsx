import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import ReviewSection from './ReviewSection';
import './PeliculaDetail.css'; 

const PeliculaDetail = () => {
  const { movieId } = useParams();
  const [pelicula, setPelicula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPelicula = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/pelicula/${movieId}`);
      console.log('PeliculaDetail fetched data:', response.data);
      console.log('MongoDB _id:', response.data._id); // DEBUG: Verificar _id
      setPelicula(response.data);
    } catch (err) {
      console.error("Error fetching pelicula details:", err);
      setError("No se pudo cargar la información de la película.");
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchPelicula();
  }, [fetchPelicula]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!pelicula) return <div className="error">Película no encontrada</div>;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="poster-wrapper">
            <img src={pelicula.imagen} alt={pelicula.titulo} className="detail-poster" />
        </div>
        <div className="detail-info">
            <h1>{pelicula.titulo}</h1>
            <div className="meta-data">
                <span>{pelicula.fecha_estreno ? new Date(pelicula.fecha_estreno).getFullYear() : 'Año desconocido'}</span>
                <span>{pelicula.duracion ? `${pelicula.duracion} min` : ''}</span>
                <span>{pelicula.director}</span>
            </div>
            <p className="synopsis">{pelicula.sinopsis}</p>
            
            <div className="additional-info">
                {/* Aquí puedes agregar más detalles específicos de película */}
            </div>
        </div>
      </div>

      <div className="reviews-container-wrapper">
        {/* CORRECCIÓN: Usar _id de MongoDB primero, que es el ObjectId real */}
        <ReviewSection 
            itemId={pelicula._id} 
            itemData={pelicula} 
            onModel="Pelicula" 
        />
      </div>
    </div>
  );
};

export default PeliculaDetail;