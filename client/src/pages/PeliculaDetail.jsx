import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaEye
} from 'react-icons/fa';
import ReviewSection from '../components/Peliculas/ReviewSection';
import "./pageStyles/PeliculaDetail.css";

const PeliculaDetail = () => {
  const { movieId } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(true);

  // Estados para "me gusta" y "ya vista"
  const [liked, setLiked] = useState(false);
  const [watched, setWatched] = useState(false);

  // Obtener detalles de la película
  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/peliculas/${movieId}`);
        setMovie(response.data);
        
        // Verificar si el usuario tiene marcado como "me gusta" o "ya vista"
        if (user) {
          try {
            const userPrefsResponse = await axios.get(
              `http://localhost:5000/api/moviePreferences/${movieId}`,
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
      } finally {
        setLoadingMovie(false);
      }
    };
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

      await axios.post(
        `http://localhost:5000/api/moviePreferences/${movieId}`,
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
    <div className="movie-detail-page">
      {loadingMovie ? (
        <p>Cargando detalles de la película...</p>
      ) : movie ? (
        <div className="movie-info">
          <img src={movie.imagen} alt={movie.titulo} className="movie-cover" />
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
        <p>Película no encontrada</p>
      )}

      <hr />

      {/* Componente ReviewSection que maneja toda la lógica de reseñas */}
      {movie && <ReviewSection movieId={movieId} movie={movie} />}
    </div>
  );
};

export default PeliculaDetail;