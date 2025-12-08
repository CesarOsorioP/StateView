import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaEye, FaStar, FaStarHalfAlt, FaRegStar
} from 'react-icons/fa';
import ReviewSection from '../components/Peliculas/ReviewSection';
import "./pageStyles/PeliculaDetail.css";
import api from '../api/api';

const PeliculaDetail = () => {
  const { movieId } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [error, setError] = useState(null);

  // Estados para "me gusta" y "ya vista"
  const [liked, setLiked] = useState(false);
  const [watched, setWatched] = useState(false);

  // Obtener detalles de la película
  useEffect(() => {
    // Asegurar que la vista se muestre desde el inicio al navegar a una película
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchMovieDetail = async () => {
      try {
        setLoadingMovie(true);
        setError(null);
        let response;
        try {
          response = await api.get(`/api/pelicula/by-item/${movieId}`);
        } catch (err) {
          response = await api.get(`/api/pelicula/${movieId}`);
        }
        if (!response.data) {
          throw new Error('No se encontró la película');
        }
        
        console.log('=== PELICULA FETCHED ===');
        console.log('Movie data:', response.data);
        console.log('Movie._id:', response.data._id);
        console.log('Movie.pelicula_id:', response.data.pelicula_id);
        
        setMovie(response.data);
        
        // Obtener estado de botones usando los endpoints correctos
        const userId = localStorage.getItem('userId');
        if (userId) {
          // Estado de visto
          try {
            const historialResponse = await api.get(`/api/persona/${userId}/historial`);
            const historialData = Array.isArray(historialResponse.data.data) ? historialResponse.data.data : [];
            const isWatched = historialData.some(item => item.contenido_id === (response.data._id || movieId) && item.tipo === 'Pelicula');
            setWatched(isWatched);
          } catch (e) { setWatched(false); }
          // Estado de me gusta
          try {
            const megustaResponse = await api.get(`/api/persona/${userId}/megusta`);
            const megustaData = Array.isArray(megustaResponse.data.data) ? megustaResponse.data.data : [];
            const isLiked = megustaData.some(item => item.contenido_id === (response.data._id || movieId) && item.tipo === 'Pelicula');
            setLiked(isLiked);
          } catch (e) { setLiked(false); }
        }
      } catch (error) {
        setError('Error al cargar los detalles de la película. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoadingMovie(false);
      }
    };
    fetchMovieDetail();
  }, [movieId, user]);

  // Botón de visto
  const handleWatchedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!watched) {
        await api.post(`/api/persona/${userId}/historial`, { contenido_id: movie._id || movieId, tipo: 'Pelicula' });
      } else {
        await api.delete(`/api/persona/${userId}/historial`, { data: { contenido_id: movie._id || movieId, tipo: 'Pelicula' } });
      }
      setWatched(!watched);
    } catch (error) {
      setWatched(watched);
    }
  };

  // Botón de me gusta
  const handleLikedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!liked) {
        await api.post(`/api/persona/${userId}/megusta`, { contenido_id: movie._id || movieId, tipo: 'Pelicula' });
      } else {
        await api.delete(`/api/persona/${userId}/megusta`, { data: { contenido_id: movie._id || movieId, tipo: 'Pelicula' } });
      }
      setLiked(!liked);
    } catch (error) {
      setLiked(liked);
    }
  };

  // Función para renderizar las estrellas de calificación
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Añadir estrellas llenas
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon" />);
    }

    // Añadir media estrella si es necesario
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon" />);
    }

    // Añadir estrellas vacías
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon" />);
    }

    return stars;
  };

  return (
    <div className="movie-detail-page">
      {loadingMovie ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando detalles de la película...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      ) : movie ? (
        <div className="movie-info">
          <img 
            src={movie.imagen} 
            alt={movie.titulo} 
            className="movie-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-image.jpg';
            }}
          />
          <div className="movie-meta">
            <h2>{movie.titulo}</h2>
            <p><strong>Director: </strong>{movie.director}</p>
            <p><strong>Género: </strong>{movie.genero}</p>
            <p><strong>Duración: </strong>{movie.duracion} </p>
            <p>
              <strong>Fecha de estreno: </strong>
              {new Date(movie.fecha_estreno).toLocaleDateString("es-ES", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            {/* Botones de Me gusta y Ya vista */}
            {user && (
              <div className="movie-actions">
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
      ) : (
        <div className="error-container">
          <p className="error-message">Película no encontrada</p>
        </div>
      )}

      <hr />

      {/* CORRECCIÓN: Usar las props correctas que espera ReviewSection */}
      {movie && movie._id && (
        <>
          <ReviewSection 
            itemId={movie._id}
            itemData={movie}
            onModel="Pelicula"
          />
        </>
      )}
      
      {movie && !movie._id && (
        <div className="error-container">
          <p className="error-message">
            Error: La película no tiene un _id válido de MongoDB.
            <pre>{JSON.stringify(movie, null, 2)}</pre>
          </p>
        </div>
      )}
    </div>
  );
};

export default PeliculaDetail;