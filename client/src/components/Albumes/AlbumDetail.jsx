import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/api';
import ReviewSection from '../Peliculas/ReviewSection';
import './AlbumDetail.css';

const AlbumDetail = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlbum = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/album/${id}`);
      setAlbum(response.data);
    } catch (err) {
      console.error("Error fetching album details:", err);
      setError("No se pudo cargar la información del álbum.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!album) return <div className="error">Álbum no encontrado</div>;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="poster-wrapper">
            <img src={album.portada} alt={album.nombre} className="detail-poster" />
        </div>
        <div className="detail-info">
            <h1>{album.nombre}</h1>
            <div className="meta-data">
                <span>{album.artista ? album.artista.nombre : 'Artista desconocido'}</span>
                <span>{album.fecha_estreno ? new Date(album.fecha_estreno).getFullYear() : ''}</span>
                <span>{album.genero}</span>
            </div>
            {/* Si hay lista de canciones, se puede mostrar aquí */}
        </div>
      </div>

      <div className="reviews-container-wrapper">
        <ReviewSection 
            itemId={album._id} 
            itemData={album} 
            onModel="Album" 
        />
      </div>
    </div>
  );
};

export default AlbumDetail;
