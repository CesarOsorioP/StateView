import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaComment, FaFlag
} from 'react-icons/fa';
import CommentSection from './commentSection';
import ReviewFilters from './ReviewFilters';
import ReportModal from '../Reportes/ReportModal';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import './ReviewSection.css';

// Componente universal de Reseñas para cualquier tipo de contenido
const ReviewSection = ({ itemId, itemData, onModel }) => {
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
  
  // Estado para controlar qué reseñas tienen el texto expandido
  const [expandedReviews, setExpandedReviews] = useState({});
  
  // Estado para controlar qué revisiones tienen los comentarios visibles
  const [showCommentsByReview, setShowCommentsByReview] = useState({});

  // Helper para truncar texto (preserva saltos de línea y aplica "Ver más/menos" a todas las reseñas, incluida la propia)
  const truncateText = (text, reviewId) => {
    if (!text) return '';
    const maxLength = 300; // Límite de caracteres antes de mostrar "Ver más"

    const renderFull = (content) => (
      <span className="review-text-content">{content}</span>
    );

    if (text.length <= maxLength) {
      return renderFull(text);
    }

    if (expandedReviews[reviewId]) {
      return (
        <>
          {renderFull(text)}
          <button 
            onClick={() => setExpandedReviews(prev => ({...prev, [reviewId]: false}))}
            className="show-more-button"
          >
            Ver menos
          </button>
        </>
      );
    }
    
    return (
      <>
        {renderFull(text.slice(0, maxLength) + '...')}
        <button 
          onClick={() => setExpandedReviews(prev => ({...prev, [reviewId]: true}))}
          className="show-more-button"
        >
          Ver más
        </button>
      </>
    );
  };

  // Estados para filtros
  const [sortOption, setSortOption] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Estados para modal de reporte
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState(null);
  const [reportReviewId, setReportReviewId] = useState(null);

  // Obtener el ID del usuario actual de forma consistente
  const currentUserId = user?._id || user?.id;

  // Obtener reseñas para el item usando useCallback
  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      
      // Si no hay itemId, no intentamos cargar reseñas y establecemos array vacío
      if (!itemId) {
        console.warn("ReviewSection: No itemId provided");
        setReviews([]);
        setLoadingReviews(false);
        return;
      }

      // Obtener reseñas desde la API (el backend ahora siempre incluye información de likes)
      const response = await api.get(`/api/reviews?itemId=${itemId}&onModel=${onModel}`);
      
      // Si la API devuelve un array directamente, usarlo. Si es objeto, intentar extraer .data o .reviews
      const reviewsData = Array.isArray(response.data) ? response.data : (response.data.data || response.data.reviews || []);
      
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Si ya teníamos reseñas (por denormalización), usarlas como fallback
      if (itemData && itemData.reviews && Array.isArray(itemData.reviews) && itemData.reviews.length > 0) {
        setReviews(itemData.reviews);
      } else {
        setErrorMessage('No se pudieron cargar las reseñas. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoadingReviews(false);
    }
  }, [itemId, itemData, onModel]);

  // Cargar reseñas cuando cambia el item
  useEffect(() => {
    if (itemId) {
      fetchReviews();
    }
  }, [fetchReviews, itemId]);

  // Aplicar ordenamiento a las reseñas
  useEffect(() => {
    if (reviews.length > 0) {
      let tempReviews = [...reviews];
      
      // Aplicar ordenamiento según los criterios seleccionados
      tempReviews.sort((a, b) => {
        // Si el filtro es por valoración
        if (ratingFilter === 'highRated') {
          return b.rating - a.rating;
        } else if (ratingFilter === 'lowRated') {
          return a.rating - b.rating;
        } else {
          // Si el filtro es 'all', ordenar por fecha
          const dateA = new Date(a.fechaReview || a.createdAt);
          const dateB = new Date(b.fechaReview || b.createdAt);
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

  // Determinar si el usuario ya tiene una reseña para este contenido
  const userReview = user && reviews.find(review => {
    if (!review) return false;
    
    // Manejar diferentes estructuras de userId (string o objeto)
    const reviewUserId = typeof review.userId === 'object' && review.userId 
      ? review.userId._id 
      : review.userId;
      
    const reviewAutorId = typeof review.autor === 'object' && review.autor
      ? review.autor._id
      : review.autor;

    return reviewUserId === currentUserId || reviewAutorId === currentUserId;
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
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return (
      <div className="stars-display">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          
          if (safeValue >= starValue) {
            return <FaStar key={index} className="star-icon" />;
          } else if (safeValue >= starValue - 0.5) {
            return <FaStarHalfAlt key={index} className="star-icon" />;
          } else {
            return <FaRegStar key={index} className="star-icon" />;
          }
        })}
        <span className="rating-value-display">{safeValue.toFixed(1)}</span>
      </div>
    );
  };

  // Función para verificar si el usuario actual ha dado like a una reseña
  const hasUserLikedReview = (review) => {
    if (!user || !review || !currentUserId) return false;
    
    // Si no hay likedReview array, retornar false
    if (!review.likedReview || !Array.isArray(review.likedReview)) return false;
    
    return review.likedReview.some(like => {
      if (!like) return false;
      
      // Manejar diferentes formatos de id_liked_review
      if (typeof like.id_liked_review === 'object' && like.id_liked_review) {
        // Puede ser ObjectId o objeto con _id
        const likeUserId = like.id_liked_review._id || like.id_liked_review;
        return likeUserId?.toString() === currentUserId.toString();
      }
      // Si es string o ObjectId directamente
      return like.id_liked_review?.toString() === currentUserId.toString();
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
      // Primero actualizamos la UI optimísticamente
      const updatedReviews = reviews.map(r => {
        const rId = getActualReviewId(r);
        if (rId === reviewId) {
          const hasLiked = hasUserLikedReview(r);
          
          if (hasLiked) {
            // Quitamos el like
            return {
              ...r,
              likedReview: (r.likedReview || []).filter(like => {
                if (!like) return false;
                
                if (typeof like.id_liked_review === 'object' && like.id_liked_review) {
                  const likeUserId = like.id_liked_review._id || like.id_liked_review;
                  return likeUserId?.toString() !== currentUserId.toString();
                }
                return like.id_liked_review?.toString() !== currentUserId.toString();
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
      
      // Obtener el estado ANTES de la actualización optimista para saber qué acción realizar
      const originalReview = reviews.find(r => getActualReviewId(r) === reviewId);
      const wasLiked = hasUserLikedReview(originalReview);
      
      setReviews(updatedReviews);
      
      // Llamada a la API
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No se encontró token de autenticación");
      
      if (wasLiked) {
        await api.delete(`/api/reviews/${reviewId}/like`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post(`/api/reviews/${reviewId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Error al cambiar el estado del like:", error);
      // En caso de error, revertimos recargando
      fetchReviews();
      
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage('Error al procesar la acción.');
      }
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

  // Función para crear reseña
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
      itemId: itemId,
      review_txt: newReview,
      rating: rating,
      onModel: onModel
    };

    try {
      const response = await api.post("/api/reviews", reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setReviews(prev => {
        const newReviewItem = response.data.review;
        const newReviewId = getActualReviewId(newReviewItem);
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

  // Función para iniciar edición
  const handleEdit = () => {
    if (!userReview) return;
    setIsEditing(true);
    setEditReviewText(userReview.review_txt || '');
    setEditRating(userReview.rating || 0);
  };

  // Función para actualizar reseña
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editReviewText.trim() || !editRating) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Debes iniciar sesión');
      return;
    }
    try {
      const response = await api.put(`/api/reviews/${userReviewId}`, {
        review_txt: editReviewText,
        rating: editRating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedFromApi = response.data?.review || response.data || {};
      setReviews(reviews.map(review => {
        if (getActualReviewId(review) !== userReviewId) return review;

        const mergedUser =
          review.userId ||
          review.user ||
          {
            _id: currentUserId,
            nombre: user?.nombre || user?.username || user?.email,
            username: user?.username,
            imagenPerfil: user?.imagenPerfil
          };

        const updatedReview = {
          ...review,
          ...updatedFromApi,
          review_txt: updatedFromApi.review_txt ?? editReviewText,
          rating: updatedFromApi.rating ?? editRating,
          calificacion: updatedFromApi.calificacion ?? updatedFromApi.rating ?? editRating,
          userId: mergedUser,
          user: mergedUser,
          userAvatar: mergedUser.imagenPerfil || review.userAvatar,
          username: mergedUser.username || mergedUser.nombre || review.username,
          fechaReview: updatedFromApi?.fechaReview || review.fechaReview || updatedFromApi?.updatedAt || new Date().toISOString(),
          createdAt: updatedFromApi?.createdAt || review.createdAt || new Date().toISOString(),
        };

        return updatedReview;
      }));
      setIsEditing(false);
      setEditReviewText('');
      setEditRating(0);
      setErrorMessage('');
    } catch (error) {
      console.error('Error al actualizar:', error);
      setErrorMessage(error.response?.data?.error || 'Error al actualizar');
    }
  };

  // Función para eliminar reseña
  const handleDelete = async () => {
    if (!userReview) return;
    if(window.confirm('¿Estás seguro de eliminar tu reseña?')){
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token");
        
        await api.delete(`/api/reviews/${userReviewId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setReviews(prev => prev.filter(review => getActualReviewId(review) !== userReviewId));
      } catch (error) {
        console.error("Error al eliminar:", error);
        setErrorMessage(error.response?.data?.error || 'Error al eliminar');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Función para abrir modal de reporte
  const openReportModal = (userId, reviewId = null) => {
    if (!user) {
      alert("Debes iniciar sesión para reportar.");
      return;
    }
    if (userId === currentUserId) {
      alert("No puedes reportarte a ti mismo.");
      return;
    }
    setReportedUserId(userId);
    setReportReviewId(reviewId);
    setReportModalOpen(true);
  };

  // Helpers para obtener datos de usuario seguros
  const getUserName = (review) => {
    if (!review) return "Usuario";
    if (review.username) return review.username;
    const u = review.userId || review.autor;
    if (typeof u === 'object' && u) {
      return u.nombre || u.username || u.email || "Usuario";
    }
    return "Usuario";
  };

  const getUserAvatar = (review) => {
    if (review.userAvatar) return review.userAvatar;
    const u = review.userId || review.autor;
    if (typeof u === 'object' && u && u.imagenPerfil) return u.imagenPerfil;
    return 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png';
  };

  const getReviewUserId = (review) => {
    if (!review) return null;
    const u = review.userId || review.autor;
    if (typeof u === 'object' && u) return u._id;
    return u;
  };

  // DEBUGGING: Imprimir props para depuración
  console.log("ReviewSection Render Props:", { itemId, onModel, hasItemData: !!itemData });

  if (!itemId) {
    console.warn("ReviewSection: itemId is missing/undefined");
    return <div className="universal-reviews"><p>No se pudo cargar la información del contenido (Falta ID)</p></div>;
  }

  return (
    <div className="universal-reviews">
      <h3 className="reviews-title">Reseñas</h3>
      
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      {/* Componente de filtros */}
      {filteredReviews.length > 0 && (
        <div className="review-filters-container">
          <ReviewFilters 
            sortOption={sortOption}
            setSortOption={setSortOption}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
          />
        </div>
      )}

      {/* Formulario de nueva reseña */}
      {user && !userReview && !isEditing && (
        <form onSubmit={handleSubmit} className="review-form">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder={`Escribe tu reseña sobre este contenido...`}
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

      {/* Reseña del usuario actual */}
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
                <button type="submit" className="update-review" disabled={!editRating || !editReviewText.trim()}>
                  Actualizar
                </button>
                <button type="button" className="cancel-edit" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="review-card user-review-card">
              <div className="review-header">
                <div className="review-user-info">
                    <img 
                      src={getUserAvatar(userReview)} 
                      alt="Avatar" 
                      className="review-avatar"
                      onError={(e) => e.target.src = 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'}
                    />
                    <div className="review-meta">
                        <strong>{user?.nombre || user?.username || "Tú"}</strong>
                        <span className="review-date">
                        {new Date(userReview.fechaReview || userReview.createdAt).toLocaleDateString("es-ES")}
                        </span>
                    </div>
                </div>
              </div>
              <p className="review-text">
                {truncateText(userReview.review_txt || userReview.contenido, userReviewId)}
              </p>
              <div className="review-rating">
                {displayStars(userReview.rating || userReview.calificacion)}
              </div>
              <div className="review-actions">
                <button onClick={handleEdit} className="edit-button">Editar</button>
                <button onClick={handleDelete} className="delete-button">Eliminar</button>
              </div>

              <div className="review-likes-section">
                <span className="likes-count">
                  {userReview.likedReview?.length || 0} Me gusta
                </span>
              </div>

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

      {/* Lista de reseñas de otros usuarios */}
      {loadingReviews ? (
        <div className="loading-reviews">
            <div className="spinner"></div>
            <p>Cargando reseñas...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="reviews-list">
          {filteredReviews
            .filter(review => getReviewUserId(review) !== currentUserId)
            .map((review) => {
              const reviewId = getActualReviewId(review);
              return (
              <div key={reviewId} className="review-card">
                <div className="review-header">
                  <div className="review-user-info">
                    <img 
                      src={getUserAvatar(review)} 
                      alt="Avatar" 
                      className="review-avatar"
                      onError={(e) => e.target.src = 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'}
                    />
                    <div className="review-meta">
                      <Link to={`/perfil/${getUserName(review)}`} className="user-link">
                        <strong>{getUserName(review)}</strong>
                      </Link>
                      <span className="review-date">
                        {new Date(review.fechaReview || review.createdAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                </div>
                <p>
                  {truncateText(review.review_txt || review.contenido, reviewId)}
                </p>
                <div className="review-rating">
                  {displayStars(review.rating || review.calificacion)}
                </div>
                
                <div className="review-actions-container">
                  <div className="review-likes-section">
                    <button 
                      className={`like-button ${hasUserLikedReview(review) ? 'liked' : ''}`}
                      onClick={() => handleReviewLikeToggle(review)}
                      disabled={!user}
                      title={user ? (hasUserLikedReview(review) ? "Quitar me gusta" : "Me gusta") : "Inicia sesión"}
                    >
                      {hasUserLikedReview(review) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                      <span>{review.likedReview?.length || 0}</span>
                    </button>
                  </div>

                  {user && (
                    <button
                      className="report-button"
                      onClick={() => openReportModal(getReviewUserId(review), reviewId)}
                      title="Reportar usuario"
                    >
                      <FaFlag /> Reportar
                    </button>
                  )}
                </div>
                
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
        !userReview && <p className="no-reviews">No hay reseñas aún. ¡Sé el primero en opinar!</p>
      )}

      {!user && (
        <div className="login-prompt">
          <p>Inicia sesión para dejar tu reseña.</p>
          <Link to="/login" className="login-link">Iniciar Sesión</Link>
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
