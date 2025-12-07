import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaComment, FaFlag
} from 'react-icons/fa';
import CommentSection from './commentSection';
import ReviewFilters from './ReviewFilters';
import ReportModal from '../Reportes/ReportModal';
import "./ReviewSection.css";
import api from '../../api/api';
import { Link } from 'react-router-dom';

const ReviewSection = ({ gameId, game }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
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
  
  // Estados para filtros
  const [sortOption, setSortOption] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');
  
  // Estados para modal de reporte
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState(null);
  const [reportReviewId, setReportReviewId] = useState(null);

  // Obtener el ID del usuario actual de forma consistente
  const currentUserId = user?._id || user?.id;

  // Obtener reseñas para el videojuego usando useCallback
  const fetchReviews = useCallback(async () => {
    try {
      // Si el videojuego ya tiene reseñas cargadas (denormalización), usarlas directamente
      if (game && game.reviews && Array.isArray(game.reviews) && game.reviews.length > 0) {
        setReviews(game.reviews);
        setLoadingReviews(false);
        return;
      }

      setLoadingReviews(true);
      // Usar el ID correcto según el modelo de videojuego
      const gameIdentifier = game?.juego_id || gameId;
      
      if (!gameIdentifier) {
        console.error("No se pudo determinar el identificador del videojuego");
        setErrorMessage("No se pudo cargar la información del videojuego");
        return;
      }

      // Añadir el filtro de tipo de contenido (onModel) a la consulta
      const response = await api.get(`/api/reviews?itemId=${gameIdentifier}&onModel=Videojuego`);
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setErrorMessage('No se pudieron cargar las reseñas. Inténtalo de nuevo más tarde.');
    } finally {
      setLoadingReviews(false);
    }
  }, [game, gameId]);

  // Cargar reseñas cuando cambia el videojuego
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Aplicar filtros a las reseñas
  useEffect(() => {
    if (reviews.length > 0) {
      let tempReviews = [...reviews];
      
      // Aplicar ordenamiento según los criterios seleccionados
      tempReviews.sort((a, b) => {
        // Si el filtro es por valoración
        if (ratingFilter === 'highRated') {
          // Ordenar de mayor a menor valoración
          return b.rating - a.rating;
        } else if (ratingFilter === 'lowRated') {
          // Ordenar de menor a mayor valoración
          return a.rating - b.rating;
        } else {
          // Si el filtro es 'all', ordenar por fecha
          const dateA = new Date(a.fechaReview);
          const dateB = new Date(b.fechaReview);
          return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
        }
      });
      
      setFilteredReviews(tempReviews);
    } else {
      setFilteredReviews([]);
    }
  }, [reviews, sortOption, ratingFilter]);

  // Función para obtener el ID real de la reseña (maneja denormalización)
  const getActualReviewId = (review) => {
    return review.reviewId || review._id;
  };

  // Determinar si el usuario ya tiene una reseña para este videojuego
  const userReview = user && reviews.find(review => {
    if (!review || !review.userId) return false;
    if (typeof review.userId === 'object') {
      return review.userId._id === currentUserId;
    }
    return review.userId === currentUserId;
  });

  const userReviewId = userReview ? getActualReviewId(userReview) : null;

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
    if (!user || !review || !review.likedReview || !currentUserId) return false;
    
    return review.likedReview.some(like => {
      if (!like) return false;
      
      if (typeof like.id_liked_review === 'object') {
        return like.id_liked_review?._id === currentUserId;
      }
      return like.id_liked_review === currentUserId;
    });
  };

  // Función para dar/quitar like a una reseña
  const handleReviewLikeToggle = async (review) => {
    const reviewId = getActualReviewId(review);
    if (!user) {
      alert("Debes iniciar sesión para dar 'me gusta'.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No se encontró token de autenticación");
      }

      // Primero actualizamos la UI optimísticamente
      const updatedReviews = reviews.map(r => {
        if (getActualReviewId(r) === reviewId) {
          const hasLiked = hasUserLikedReview(r);
          
          if (hasLiked) {
            // Quitamos el like
            return {
              ...r,
              likedReview: r.likedReview.filter(like => {
                if (!like) return false;
                
                if (typeof like.id_liked_review === 'object') {
                  return like.id_liked_review?._id !== currentUserId;
                }
                return like.id_liked_review !== currentUserId;
              })
            };
          } else {
            // Añadimos el like
            return {
              ...r,
              likedReview: [
                ...(r.likedReview || []),
                {
                  id_liked_review: currentUserId,
                  nombre_persona_review: user?.nombre || user?.email || "Usuario",
                  id_persona_review: currentUserId
                }
              ]
            };
          }
        }
        return r;
      });
      
      setReviews(updatedReviews);
      
      // Llamada a la API
      const reviewToUpdate = reviews.find(r => getActualReviewId(r) === reviewId);
      const hasLiked = hasUserLikedReview(reviewToUpdate);
      
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.trim() || rating === 0) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Debes iniciar sesión para crear una reseña');
      return;
    }

    const reviewData = {
      itemId: game._id,
      review_txt: newReview,
      rating: rating,
      onModel: 'Videojuego'
    };

    try {
      const response = await api.post("/api/reviews", reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Se añade la reseña creada al inicio de la lista
      setReviews(prev => {
        const newReviewItem = response.data.review;
        const newReviewId = getActualReviewId(newReviewItem);
        // Aseguramos que no haya duplicados
        return [newReviewItem, ...prev.filter(item => getActualReviewId(item) !== newReviewId)];
      });
      setNewReview('');
      setRating(0);
      setErrorMessage('');
    } catch (error) {
      console.error("Error al enviar la reseña:", error);
      setErrorMessage(error.response?.data?.error || 'Error al crear la reseña');
    }
  };

  // Función para iniciar el proceso de edición
  const handleEdit = () => {
    if (!userReview) return;
    
    setIsEditing(true);
    setEditReviewText(userReview.review_txt || '');
    setEditRating(userReview.rating || 0);
  };

  // Función para actualizar la reseña
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editReviewText.trim() || !editRating) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Debes iniciar sesión para editar la reseña');
      return;
    }
    try {
      const response = await api.put(`/api/reviews/${userReviewId}`, {
        review_txt: editReviewText,
        rating: editRating
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setReviews(reviews.map(review => 
        getActualReviewId(review) === userReviewId ? response.data : review
      ));
      setIsEditing(false);
      setEditReviewText('');
      setEditRating(0);
      setErrorMessage('');
    } catch (error) {
      console.error('Error al actualizar la reseña:', error);
      setErrorMessage(error.response?.data?.error || 'Error al actualizar la reseña');
    }
  };

  // Función para eliminar la reseña
  const handleDelete = async () => {
    if (!userReview) return;
    
    if(window.confirm('¿Estás seguro de eliminar tu reseña?')){
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No se encontró token de autenticación");
        }
        
        await api.delete(`/api/reviews/${userReviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setReviews(prev => prev.filter(review => getActualReviewId(review) !== userReviewId));
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
    if (!review) return "Usuario";
    // Primero intentar obtener el nombre de usuario denormalizado
    if (review.username) return review.username;
    // Si no existe, intentar obtenerlo del objeto userId poblado
    if (review.userId && typeof review.userId === 'object') {
      return review.userId.nombre || review.userId.username || review.userId.email || "Usuario";
    }
    return "Usuario";
  };

  // Función para obtener el ID de usuario desde el objeto de reseña
  const getUserId = (review) => {
    if (!review || !review.userId) return null;
    
    if (typeof review.userId === 'object') {
      return review.userId?._id;
    }
    return review.userId;
  };

  if (!game && !gameId) {
    return <div className="game-reviews"><p>No se pudo cargar la información del videojuego</p></div>;
  }

  return (
    <div className="game-reviews">
      <h3>Reseñas</h3>

      {/* Filtros de reseñas */}
      <ReviewFilters 
        sortOption={sortOption}
        setSortOption={setSortOption}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
      />

      {/* Si el usuario está autenticado y no tiene reseña publicada, se muestra el formulario de creación */}
      {user && !userReview && !isEditing && (
        <form onSubmit={handleSubmit} className="review-form">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Escribe tu reseña sobre este videojuego..."
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
                <strong>{user?.nombre || user?.email || user?.username || "Usuario"}</strong>
                <span className="review-date">
                  {new Date(userReview?.fechaReview).toLocaleDateString("es-ES")}
                </span>
              </div>
              <p className="review-text">{userReview?.review_txt}</p>
              <div className="review-rating">
                {displayStars(userReview?.rating || 0)}
              </div>
              <div className="review-actions">
                <button onClick={handleEdit} className="edit-button">Editar Reseña</button>
                <button onClick={handleDelete} className="delete-button">Eliminar Reseña</button>
              </div>

              {/* Contador de likes para la reseña del usuario */}
              <div className="review-likes">
                <span className="likes-count">
                  {userReview?.likedReview?.length || 0} Me gusta
                </span>
              </div>

              {/* Sección de comentarios para la reseña del usuario */}
              <div className="review-comments-section">
                <button 
                  className="toggle-comments-button"
                  onClick={() => toggleComments(userReviewId)}
                >
                  <FaComment /> {showCommentsByReview[userReviewId] ? 'Ocultar comentarios' : 'Ver comentarios'}
                </button>
                
                {showCommentsByReview[userReviewId] && (
                  <CommentSection 
                    reviewId={userReviewId} 
                    toggleComments={() => toggleComments(userReviewId)} 
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
      ) : filteredReviews.length > 0 ? (
        <div className="reviews-list">
          {filteredReviews
            .filter(review => !(user && ((typeof review.userId === 'object' && review.userId._id === currentUserId) || 
                                       (typeof review.userId === 'string' && review.userId === currentUserId))))
            .map((review) => {
              const reviewId = getActualReviewId(review);
              return (
              <div key={reviewId} className="review-card">
                <div className="review-header">
                  <div className="review-user-info">
                    <img 
                      src={review.userAvatar || (typeof review.userId === 'object' ? review.userId?.imagenPerfil : null) || 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'} 
                      alt="Avatar" 
                      className="review-avatar"
                      onError={(e) => e.target.src = 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'}
                    />
                    <div className="review-meta">
                      <Link to={`/perfil/${getUserName(review)}`} className="user-link">
                        <strong>{getUserName(review)}</strong>
                      </Link>
                      <span className="review-date">
                        {review?.fechaReview ? new Date(review.fechaReview).toLocaleDateString("es-ES") : "Fecha no disponible"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="review-text">{review?.review_txt || ""}</p>
                <div className="review-rating">
                  {displayStars(review?.rating || 0)}
                </div>
                
                {/* Acciones de reseña: Like y Reportar */}
                <div className="review-actions-container">
                  {/* Botón de Like */}
                  <div className="review-likes-section">
                    <button 
                      className={`like-button ${hasUserLikedReview(review) ? 'liked' : ''}`}
                      onClick={() => handleReviewLikeToggle(review)}
                      disabled={!user}
                      title={user ? (hasUserLikedReview(review) ? "Quitar me gusta" : "Me gusta") : "Inicia sesión para dar me gusta"}
                    >
                      {hasUserLikedReview(review) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                      <span>{review?.likedReview?.length || 0}</span>
                    </button>
                  </div>
                  
                  {/* Botón de Reportar */}
                  {user && (
                    <button
                      className="report-button"
                      onClick={() => openReportModal(
                        typeof review.userId === 'object' ? review.userId?._id : review.userId,
                        reviewId
                      )}
                      title="Reportar usuario"
                    >
                      <FaFlag /> Reportar
                    </button>
                  )}
                </div>
                
                {/* Sección de comentarios */}
                <div className="review-comments-section">
                  <button 
                    className="toggle-comments-button"
                    onClick={() => toggleComments(reviewId)}
                  >
                    <FaComment /> {showCommentsByReview[reviewId] ? 'Ocultar comentarios' : 'Ver comentarios'}
                  </button>
                  
                  {showCommentsByReview[reviewId] && (
                    <CommentSection 
                      reviewId={reviewId} 
                      toggleComments={() => toggleComments(reviewId)} 
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-reviews">No hay reseñas aún. ¡Sé el primero en reseñar este videojuego!</p>
      )}

      {/* Mensaje para usuarios no autenticados */}
      {!user && (
        <div className="login-prompt">
          <p>Inicia sesión para dejar tu reseña y puntuar este videojuego.</p>
        </div>
      )}

      {/* Modal de reporte */}
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