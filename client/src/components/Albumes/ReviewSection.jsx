import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaComment
} from 'react-icons/fa';
import CommentSection from './commentSection';
import "./reviewSection.css";

const ReviewSection = ({ albumId, album }) => {
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

  // Obtener reseñas para el álbum usando useCallback
  const fetchReviews = useCallback(async () => {
    try {
      // Usamos el id del álbum directamente si está disponible, o caemos en el _id del objeto album
      const currentAlbumId = albumId || (album && album._id);
      
      if (currentAlbumId) {
        // Aseguramos que estamos filtrando por itemId específico del álbum actual
        const response = await api.get(`/api/reviews?itemId=${currentAlbumId}&onModel=Album`);
        setReviews(response.data);
      } else {
        // Si no hay id, limpiamos las reseñas
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [albumId, album]);

  // Cargar reseñas cuando cambia el álbum
  useEffect(() => {
    setLoadingReviews(true);
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

  // Determinar si el usuario ya tiene una reseña para este álbum
  const currentUserId = user?.id || user?._id;
  const userReview = user && reviews.find(review => {
    // review.userId puede venir como objeto (por populate) o como string
    if (typeof review.userId === 'object' && review.userId) {
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
    if (!user || !review || !review.likedReview) return false;
    return review.likedReview.some(like => {
      if (like && typeof like.id_liked_review === 'object' && like.id_liked_review) {
        return like.id_liked_review._id === currentUserId;
      }
      return like && like.id_liked_review === currentUserId;
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
              likedReview: review.likedReview ? review.likedReview.filter(like => {
                if (like && typeof like.id_liked_review === 'object' && like.id_liked_review) {
                  return like.id_liked_review._id !== currentUserId;
                }
                return like && like.id_liked_review !== currentUserId;
              }) : []
            };
          } else {
            // Añadimos el like
            return {
              ...review,
              likedReview: [
                ...(review.likedReview || []),
                {
                  id_liked_review: currentUserId,
                  nombre_persona_review: user?.nombre || user?.email || "Usuario",
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
      const hasLiked = reviewToUpdate ? hasUserLikedReview(reviewToUpdate) : false;
      
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
    if (!album) {
      alert("El álbum aún no está cargado.");
      return;
    }
    if (!currentUserId) {
      alert("Error: no se pudo identificar al usuario.");
      return;
    }

    // Aseguramos que siempre se use el ID correcto del álbum
    const itemIdToUse = albumId || album._id;
    if (!itemIdToUse) {
      alert("Error: no se pudo identificar el álbum.");
      return;
    }

    const reviewData = {
      userId: currentUserId,
      itemId: itemIdToUse,
      review_txt: newReview,
      rating: rating,
      onModel: "Album" // Especificamos que es un álbum
    };

    try {
      const response = await api.post("/api/reviews", reviewData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
    if (!userReview) return;
    setIsEditing(true);
    setEditReviewText(userReview.review_txt || '');
    setEditRating(userReview.rating || 0);
  };

  // Función para actualizar la reseña
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!userReview) return;
    
    try {
      const response = await api.put(`/api/reviews/${userReview._id}`, {
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
    if (!userReview) return;
    
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

  // Función para mostrar nombre de usuario de forma segura
  const getUserDisplayName = (userObj) => {
    if (!userObj) return "Usuario";
    return userObj.email || userObj.username || userObj.nombre || "Usuario";
  };

  return (
    <div className="album-reviews">
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
                <strong>{getUserDisplayName(user)}</strong>
                <span className="review-date">
                  {userReview && userReview.fechaReview ? 
                    new Date(userReview.fechaReview).toLocaleDateString("es-ES") : 
                    new Date().toLocaleDateString("es-ES")}
                </span>
              </div>
              <p className="review-text">{userReview.review_txt || ''}</p>
              <div className="review-rating">
                {displayStars(userReview.rating || 0)}
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
              if (!user || !review) return true;
              if (typeof review.userId === 'object' && review.userId) {
                return review.userId._id !== currentUserId;
              }
              return review.userId !== currentUserId;
            })
            .map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <strong>
                    {typeof review.userId === 'object' && review.userId
                      ? getUserDisplayName(review.userId)
                      : "Usuario"}
                  </strong>
                  <span className="review-date">
                    {review.fechaReview ? 
                      new Date(review.fechaReview).toLocaleDateString("es-ES") : 
                      ""}
                  </span>
                </div>
                <p className="review-text">{review.review_txt || ''}</p>
                <div className="review-rating">
                  {displayStars(review.rating || 0)}
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
        <p className="no-reviews">No hay reseñas aún. ¡Sé el primero en reseñar este álbum!</p>
      )}

      {/* Mensaje para usuarios no autenticados */}
      {!user && (
        <div className="login-prompt">
          <p>Inicia sesión para dejar tu reseña y puntuar este álbum.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;