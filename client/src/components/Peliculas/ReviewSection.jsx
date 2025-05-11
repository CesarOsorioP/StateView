import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaComment
} from 'react-icons/fa';
import CommentSection from './commentSection';
import ReportModal from '../Reportes/ReportModal';
import api from '../../api/api';

const MovieReviewSection = ({ movieId, movie, onMovieUpdate }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para crear reseña
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Estados para edición de reseña
  const [isEditing, setIsEditing] = useState(false);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  
  // Estado para controlar qué revisiones tienen los comentarios visibles
  const [showCommentsByReview, setShowCommentsByReview] = useState({});

  // Obtener el ID del usuario actual de forma consistente
  const currentUserId = user?._id || user?.id;

  // Obtener reseñas para la película usando useCallback
  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      // Usar el ID correcto según el modelo de película
      const movieIdentifier = movie?._id || movie?.pelicula_id || movieId;
      
      if (!movieIdentifier) {
        console.error("No se pudo determinar el identificador de la película");
        setErrorMessage("No se pudo cargar la información de la película");
        return;
      }

      const response = await api.get(`/api/reviews?itemId=${movieIdentifier}`);
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setErrorMessage('No se pudieron cargar las reseñas. Inténtalo de nuevo más tarde.');
    } finally {
      setLoadingReviews(false);
    }
  }, [movie, movieId]);

  // Cargar reseñas cuando cambia la película
  useEffect(() => {
    if (movie || movieId) {
      fetchReviews();
    }
  }, [fetchReviews, movie, movieId]);

  // Determinar si el usuario ya tiene una reseña para esta película
  const userReview = user && reviews.find(review => {
    if (!review || !review.userId) return false;
    if (typeof review.userId === 'object') {
      return review.userId._id === currentUserId;
    }
    return review.userId === currentUserId;
  });

  // Renderizado de estrellas (para calificación)
  const renderStars = (value, hover, setRatingFunc, setHoverFunc) => {
    return (
      <div className="stars-container">
        {[...Array(10)].map((_, index) => {
          // Valor de la estrella (0.5, 1, 1.5, 2, etc.)
          const starValue = (index + 1) / 2;
          
          return (
            <span
              key={index}
              className={`star ${index % 2 === 0 ? 'star-left' : 'star-right'}`}
              onClick={() => setRatingFunc(starValue)}
              onMouseEnter={() => setHoverFunc(starValue)}
              onMouseLeave={() => setHoverFunc(0)}
            >
              {index % 2 === 0 ? (
                // Para posiciones pares (0,2,4...) - mitad izquierda
                starValue <= (hover || value) ? (
                  <FaStarHalfAlt className="star-icon" />
                ) : (
                  <FaRegStar className="star-icon" />
                )
              ) : (
                // Para posiciones impares (1,3,5...) - mitad derecha
                starValue <= (hover || value) ? (
                  <FaStar className="star-icon" />
                ) : (
                  <FaRegStar className="star-icon" />
                )
              )}
            </span>
          );
        })}
        <span className="rating-value">{(hover || value).toFixed(1)}</span>
      </div>
    );
  };

  // Renderizado de estrellas para visualización (no interactivas)
  const displayStars = (value) => {
    return (
      <div className="stars-display">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          
          if (value >= starValue) {
            return <FaStar key={index} className="star-icon" />;
          } else if (value >= starValue - 0.5) {
            return <FaStarHalfAlt key={index} className="star-icon" />;
          } else {
            return <FaRegStar key={index} className="star-icon" />;
          }
        })}
        <span className="rating-value-display">{value.toFixed(1)}</span>
      </div>
    );
  };

  // Función para verificar si el usuario actual ha dado like a una reseña
  const hasUserLikedReview = (review) => {
    if (!user || !review.likedReview || !currentUserId) return false;
    
    return review.likedReview.some(like => {
      if (typeof like.id_liked_review === 'object') {
        return like.id_liked_review._id === currentUserId;
      }
      return like.id_liked_review === currentUserId;
    });
  };

  // Función para dar/quitar like a una reseña
  const handleReviewLikeToggle = async (reviewId) => {
    if (!user) {
      alert("Debes iniciar sesión para dar 'me gusta'.");
      return;
    }

    try {
      // Primero actualizamos la UI optimísticamente
      const updatedReviews = reviews.map(review => {
        if (review._id === reviewId) {
          const hasLiked = hasUserLikedReview(review);
          
          if (hasLiked) {
            // Quitamos el like
            return {
              ...review,
              likedReview: review.likedReview.filter(like => {
                if (typeof like.id_liked_review === 'object') {
                  return like.id_liked_review._id !== currentUserId;
                }
                return like.id_liked_review !== currentUserId;
              })
            };
          } else {
            // Añadimos el like
            return {
              ...review,
              likedReview: [
                ...(review.likedReview || []),
                {
                  id_liked_review: currentUserId,
                  nombre_persona_review: user.nombre || user.email || "Usuario",
                  id_persona_review: currentUserId
                }
              ]
            };
          }
        }
        return review;
      });
      
      setReviews(updatedReviews);
      
      // Llamada a la API
      const reviewToUpdate = reviews.find(r => r._id === reviewId);
      const hasLiked = hasUserLikedReview(reviewToUpdate);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      
      if (hasLiked) {
        // Si ya tiene like, lo quitamos
        await api.delete(`/api/reviews/${reviewId}/unlike`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Si no tiene like, lo añadimos
        await api.post(`/api/reviews/${reviewId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Error al cambiar el estado del like:", error);
      // En caso de error, revertimos el cambio optimista haciendo una recarga de las reseñas
      fetchReviews();
      
      // Mostrar mensaje de error
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Error al procesar la acción. Inténtalo de nuevo.');
      }
      
      // Limpiar mensaje de error después de 3 segundos
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Función para mostrar/ocultar la sección de comentarios
  const toggleComments = (reviewId) => {
    setShowCommentsByReview(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Función para crear reseña si el usuario aún no ha reseñado
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para reseñar.");
      return;
    }

    if (!newReview.trim()) {
      alert("Por favor, escribe una reseña.");
      return;
    }

    if (rating === 0) {
      alert("Por favor, selecciona una calificación.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Asegurarnos de que tenemos el ID correcto del usuario
      const userId = user.id || user._id;
      if (!userId) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      // Asegurarnos de que tenemos el ID correcto de la película
      const itemId = movie?._id || movieId;
      if (!itemId) {
        throw new Error("No se pudo obtener el ID de la película");
      }

      const reviewData = {
        userId,
        itemId,
        onModel: "Pelicula",
        review_txt: newReview,
        rating: rating
      };

      const response = await api.post('http://localhost:5000/api/reviews', reviewData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Actualizar la lista de reseñas con la nueva reseña
      setReviews(prevReviews => [response.data.review, ...prevReviews]);
      
      // Actualizar la información de la película con los nuevos ratings
      if (response.data.updatedItem) {
        // Actualizar el estado local
        if (movie) {
          movie.totalRating = response.data.updatedItem.totalRating;
          movie.ratingCount = response.data.updatedItem.ratingCount;
          movie.averageRating = response.data.updatedItem.averageRating;
        }
        // Notificar al componente padre del cambio
        onMovieUpdate(response.data.updatedItem);
      }
      
      // Limpiar el formulario
      setNewReview('');
      setRating(0);
      setHoverRating(0);
      
      // Mostrar mensaje de éxito
      setErrorMessage('Reseña creada exitosamente');
      setTimeout(() => setErrorMessage(''), 3000);

    } catch (error) {
      console.error("Error al crear la reseña:", error);
      
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Error al crear la reseña. Inténtalo de nuevo.');
      }
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Función para iniciar el proceso de edición
  const handleEdit = () => {
    setIsEditing(true);
    setEditReviewText(userReview.review_txt);
    setEditRating(userReview.rating);
  };

  // Función para actualizar la reseña
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }
      
      const response = await api.put(`http://localhost:5000/api/reviews/${userReview._id}`, {
        review_txt: editReviewText,
        rating: editRating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizamos la reseña en el estado
      const updatedReview = response.data.review;
      setReviews(prev => prev.map(review => review._id === userReview._id ? updatedReview : review));
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la reseña:", error);
      
      // Mostrar mensaje de error específico del servidor si está disponible
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Error al actualizar la reseña. Inténtalo de nuevo.');
      }
      
      // Limpiar mensaje de error después de 3 segundos
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Función para eliminar la reseña
  const handleDelete = async () => {
    if(window.confirm('¿Estás seguro de eliminar tu reseña?')){
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No se encontró token de autenticación");
        }
        
        await api.delete(`/api/reviews/${userReview._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setReviews(prev => prev.filter(review => review._id !== userReview._id));
      } catch (error) {
        console.error("Error al eliminar la reseña:", error);
        
        // Mostrar mensaje de error específico del servidor si está disponible
        if (error.response && error.response.data && error.response.data.error) {
          setErrorMessage(error.response.data.error);
        } else {
          setErrorMessage('Error al eliminar la reseña. Inténtalo de nuevo.');
        }
        
        // Limpiar mensaje de error después de 3 segundos
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Función para abrir el modal de reporte de usuario
  const openReportModal = (userId, reviewId = null) => {
    if (!user) {
      alert("Debes iniciar sesión para reportar a un usuario.");
      return;
    }
    
    // No permitir auto-reportes
    if (userId === currentUserId) {
      alert("No puedes reportarte a ti mismo.");
      return;
    }
    
    setReportedUserId(userId);
    setReportReviewId(reviewId);
    setReportModalOpen(true);
  };

  // Función para obtener el nombre de usuario desde el objeto de reseña
  const getUserName = (review) => {
    if (typeof review.userId === 'object') {
      return review.userId.nombre || review.userId.email || review.userId.username || "Usuario";
    }
    return "Usuario";
  };

  if (!movie && !movieId) {
    return <div className="movie-reviews"><p>No se pudo cargar la información de la película</p></div>;
  }

  return (
    <div className="movie-reviews">
      <h3>Reseñas</h3>
      
      {/* Mensaje de error */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {/* Si el usuario está autenticado y no tiene reseña publicada, se muestra el formulario de creación */}
      {user && !userReview && !isEditing && (
        <form onSubmit={handleReviewSubmit} className="review-form">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Escribe tu reseña sobre esta película..."
            required
          />
          <div className="rating-container">
            <label>Calificación: </label>
            {renderStars(rating, hoverRating, setRating, setHoverRating)}
          </div>
          <button 
            type="submit" 
            className="submit-review" 
            disabled={!rating || !newReview.trim()}
          >
            Publicar Reseña
          </button>
        </form>
      )}

      {/* Si el usuario tiene una reseña, se muestra con opciones de editar y eliminar */}
      {user && userReview && (
        <div className="user-review">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="review-form">
              <textarea
                value={editReviewText}
                onChange={(e) => setEditReviewText(e.target.value)}
                required
              />
              <div className="rating-container">
                <label>Calificación: </label>
                {renderStars(editRating, editHoverRating, setEditRating, setEditHoverRating)}
              </div>
              <div className="edit-buttons">
                <button 
                  type="submit" 
                  className="update-review"
                  disabled={!editRating || !editReviewText.trim()}
                >
                  Actualizar Reseña
                </button>
                <button 
                  type="button" 
                  className="cancel-edit" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="review-card user-review-card">
              <div className="review-header">
                <strong>{user.nombre || user.email || user.username || "Usuario"}</strong>
                <span className="review-date">
                  {new Date(userReview.fechaReview).toLocaleDateString("es-ES")}
                </span>
              </div>
              <p className="review-text">{userReview.review_txt}</p>
              <div className="review-rating">
                {displayStars(userReview.rating)}
              </div>
              <div className="review-actions">
                <button onClick={handleEdit} className="edit-button">Editar Reseña</button>
                <button onClick={handleDelete} className="delete-button">Eliminar Reseña</button>
              </div>

              {/* Contador de likes para la reseña del usuario */}
              <div className="review-likes">
                <span className="likes-count">
                  {userReview.likedReview?.length || 0} Me gusta
                </span>
              </div>

              {/* Sección de comentarios para la reseña del usuario */}
              <div className="review-comments-section">
                <button 
                  className="toggle-comments-button"
                  onClick={() => toggleComments(userReview._id)}
                >
                  <FaComment /> {showCommentsByReview[userReview._id] ? 'Ocultar comentarios' : 'Ver comentarios'}
                </button>
                
                {showCommentsByReview[userReview._id] && (
                  <CommentSection 
                    reviewId={userReview._id} 
                    toggleComments={() => toggleComments(userReview._id)} 
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mostrar todas las reseñas (excluyendo la del usuario actual para evitar duplicados) */}
      {loadingReviews ? (
        <p>Cargando reseñas...</p>
      ) : reviews.length > 0 ? (
        <div className="reviews-list">
          {reviews
            .filter(review => {
              // Evitar mostrar la reseña del usuario actual dos veces
              if (!user || !currentUserId) return true;
              
              if (typeof review.userId === 'object') {
                return review.userId._id !== currentUserId;
              }
              return review.userId !== currentUserId;
            })
            .map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <strong>{getUserName(review)}</strong>
                  <span className="review-date">
                    {new Date(review.fechaReview).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <p className="review-text">{review.review_txt}</p>
                <div className="review-rating">
                  {displayStars(review.rating)}
                </div>
                
                {/* Botón de Like y contador para reseñas */}
                <div className="review-likes-section">
                  <button 
                    className={`like-button ${hasUserLikedReview(review) ? 'liked' : ''}`}
                    onClick={() => handleReviewLikeToggle(review._id)}
                    disabled={!user}
                    title={user ? (hasUserLikedReview(review) ? "Quitar me gusta" : "Me gusta") : "Inicia sesión para dar me gusta"}
                  >
                    {hasUserLikedReview(review) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                    <span>{review.likedReview?.length || 0}</span>
                  </button>
                </div>

                {user && (
                  <button
                    className="report-button"
                    onClick={() => openReportModal(
                      typeof review.userId === 'object' ? review.userId._id : review.userId,
                      review._id
                    )}
                    title="Reportar usuario"
                  >
                    <FaFlag /> Reportar
                  </button>
                )}                
                
                {/* Sección de comentarios */}
                <div className="review-comments-section">
                  <button 
                    className="toggle-comments-button"
                    onClick={() => toggleComments(review._id)}
                  >
                    <FaComment /> {showCommentsByReview[review._id] ? 'Ocultar comentarios' : 'Ver comentarios'}
                  </button>
                  
                  {showCommentsByReview[review._id] && (
                    <CommentSection 
                      reviewId={review._id} 
                      toggleComments={() => toggleComments(review._id)} 
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="no-reviews">No hay reseñas aún. ¡Sé el primero en reseñar esta película!</p>
      )}

      {/* Mensaje para usuarios no autenticados */}
      {!user && (
        <div className="login-prompt">
          <p>Inicia sesión para dejar tu reseña y puntuar esta película.</p>
        </div>
      )}
      <ReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportedUserId={reportedUserId}
        reviewId={reportReviewId}
      />
    </div>
  );
};

export default ReviewSection;