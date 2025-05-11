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
  const fetchMovieDetail = async () => {
    try {
      setLoadingMovie(true);
      setError(null);
      
      // Primero intenta buscar por _id (by-item), si falla busca por pelicula_id
      let response;
      try {
        response = await api.get(`/api/peliculas/by-item/${movieId}`);
      } catch (err) {
        // Si no existe por _id, busca por pelicula_id
        response = await api.get(`/api/peliculas/${movieId}`);
      }

      if (!response.data) {
        throw new Error('No se encontró la película');
      }

      setMovie(response.data);
      
      // Verificar si el usuario tiene marcado como "me gusta" o "ya vista"
      if (user) {
        try {
          const userPrefsResponse = await api.get(
            `/api/moviePreferences/${response.data._id || movieId}`,
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
      console.error("Error fetching movie details:", error);
      setError('Error al cargar los detalles de la película. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoadingMovie(false);
    }
  };

  useEffect(() => {
    fetchMovieDetail();
  }, [movieId, user]);

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
        `/api/moviePreferences/${movieId}`,
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

  // Función para actualizar la película cuando cambia su rating
  const handleMovieUpdate = (updatedMovie) => {
    setMovie(prevMovie => ({
      ...prevMovie,
      ...updatedMovie
    }));
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
            
            {/* Mostrar el rating promedio si existe */}
            {movie.averageRating && (
              <div className="movie-rating">
                <strong>Calificación promedio: </strong>
                <div className="stars-container">
                  {renderStars(movie.averageRating)}
                  <span className="rating-value">
                    {movie.averageRating.toFixed(1)} ({movie.ratingCount} reseñas)
                  </span>
                </div>
              </div>
            )}
            
            {/* Botones de Me gusta y Ya vista */}
            {user && (
              <div className="movie-actions">
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

      {/* Componente ReviewSection que maneja toda la lógica de reseñas */}
      {movie && (
        <ReviewSection 
          movieId={movie._id || movieId} 
          movie={movie} 
          onMovieUpdate={handleMovieUpdate}
        />
      )}
    </div>
  );
};

export default PeliculaDetail;