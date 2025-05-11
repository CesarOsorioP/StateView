import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaComment, FaFlag
} from 'react-icons/fa';
import CommentSection from './commentSection';
import ReportModal from '../Reportes/ReportModal'; // Importamos el nuevo componente
import "./ReviewSection.css";
import api from '../../api/api'

const ReviewSection = ({ gameId, game }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

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
  
  // Estados para modal de reporte
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState(null);
  const [reportReviewId, setReportReviewId] = useState(null);

  // Obtener reseñas para el videojuego usando useCallback
  const fetchReviews = useCallback(async () => {
    try {
      if (game && game._id) {
        const response = await api.get(`/api/reviews?itemId=${game._id}`);
        setReviews(response.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  }, [game]);

  // Cargar reseñas cuando cambia el videojuego
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Determinar si el usuario ya tiene una reseña para este videojuego
  const currentUserId = user?.id || user?._id;
  const userReview = user && reviews.find(review => {
    // review.userId puede venir como objeto (por populate) o como string
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
    if (!user || !review.likedReview) return false;
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
      
      if (hasLiked) {
        // Si ya tiene like, lo quitamos
        await api.delete(`/api/reviews/${reviewId}/unlike`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        // Si no tiene like, lo añadimos
        await api.post(`/api/reviews/${reviewId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
    } catch (error) {
      console.error("Error al cambiar el estado del like:", error);
      // En caso de error, revertimos el cambio optimista haciendo una recarga de las reseñas
      fetchReviews();
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
    if (!game) {
      alert("El videojuego aún no está cargado.");
      return;
    }
    if (!currentUserId) {
      alert("Error: no se pudo identificar al usuario.");
      return;
    }

    const reviewData = {
      userId: currentUserId,
      itemId: game._id,
      review_txt: newReview,
      rating: rating,
      onModel: "Videojuego"  // Cambiado de "Album" a "Videojuego"
    };

    try {
      const response = await api.post('http://localhost:5000/api/reviews', reviewData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Se añade la reseña creada al inicio de la lista
      setReviews(prev => {
        const newReviewItem = response.data.review;
        // Aseguramos que no haya duplicados
        return [newReviewItem, ...prev.filter(item => item._id !== newReviewItem._id)];
      });
      setNewReview('');
      setRating(0);
    } catch (error) {
      console.error("Error al enviar la reseña:", error);
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
      const response = await api.put(`http://localhost:5000/api/reviews/${userReview._id}`, {
        review_txt: editReviewText,
        rating: editRating
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Actualizamos la reseña en el estado
      const updatedReview = response.data.review;
      setReviews(prev => prev.map(review => review._id === userReview._id ? updatedReview : review));
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la reseña:", error);
    }
  };

  // Función para eliminar la reseña
  const handleDelete = async () => {
    if(window.confirm('¿Estás seguro de eliminar tu reseña?')){
      try {
        await api.delete(`/api/reviews/${userReview._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setReviews(prev => prev.filter(review => review._id !== userReview._id));
      } catch (error) {
        console.error("Error al eliminar la reseña:", error);
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

  return (
    <div className="game-reviews">
      <h3>Reseñas</h3>

      {/* Si el usuario está autenticado y no tiene reseña publicada, se muestra el formulario de creación */}
      {user && !userReview && !isEditing && (
        <form onSubmit={handleReviewSubmit} className="review-form">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Escribe tu reseña..."
            required
          />
          <div className="rating-container">
            <label>Calificación: </label>
            {renderStars(rating, hoverRating, setRating, setHoverRating)}
          </div>
          <button type="submit" className="submit-review">Publicar Reseña</button>
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
                <button type="submit" className="update-review">Actualizar Reseña</button>
                <button type="button" className="cancel-edit" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="review-card user-review-card">
              <div className="review-header">
                <strong>{user.email || user.username}</strong>
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
            .filter(review => !(user && ((typeof review.userId === 'object' && review.userId._id === currentUserId) || 
                                       (typeof review.userId === 'string' && review.userId === currentUserId))))
            .map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <strong>{typeof review.userId === 'object' ? review.userId.email || review.userId.username : "Usuario"}</strong>
                  <span className="review-date">
                    {new Date(review.fechaReview).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <p className="review-text">{review.review_txt}</p>
                <div className="review-rating">
                  {displayStars(review.rating)}
                </div>
                
                {/* Acciones de reseña: Like y Reportar */}
                <div className="review-actions-container">
                  {/* Botón de Like */}
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
                  
                  {/* Botón de Reportar */}
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
                </div>
                
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