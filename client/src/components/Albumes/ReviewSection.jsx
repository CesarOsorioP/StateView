import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaRegThumbsUp, FaComment
} from 'react-icons/fa';
import CommentSection from './commentSection';
import "./reviewSection.css";
import { Link } from 'react-router-dom';
import ReviewFilters from './ReviewFilters';
import './ReviewFilters.css';

const ReviewSection = ({ albumId, album }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Estados para crear reseña
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para edición de reseña
  const [isEditing, setIsEditing] = useState(false);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState(null);
  
  // Estado para controlar qué revisiones tienen los comentarios visibles
  const [showCommentsByReview, setShowCommentsByReview] = useState({});

  // Filtros de reseñas
  const [sortOption, setSortOption] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');
  const albumName = album?.titulo || album?.nombre || album?.Title || 'Álbum';

  // Solo permitir reseñas si el álbum tiene _id (MongoDB)
  const canReview = album && album._id;

  // Obtener reseñas para el álbum usando useCallback
  const fetchReviews = async () => {
    if (!canReview) {
      setReviews([]);
      setLoadingReviews(false);
      return;
    }
    try {
      // Si el álbum ya tiene reseñas cargadas (denormalización), usarlas directamente
      if (album && album.reviews && Array.isArray(album.reviews) && album.reviews.length > 0) {
        setReviews(album.reviews);
        setLoadingReviews(false);
        return;
      }

      const response = await api.get(`/api/reviews?itemId=${album._id}&onModel=Album`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Cargar reseñas cuando cambia el álbum
  useEffect(() => {
    setLoadingReviews(true);
    fetchReviews();
  }, [album && album._id]);

  // Función para obtener el ID real de la reseña (maneja denormalización)
  const getActualReviewId = (review) => {
    return review.reviewId || review._id;
  };

  // Determinar si el usuario ya tiene una reseña para este álbum
  const currentUserId = user?.id || user?._id;
  const userReview = user && reviews.find(review => {
    // review.userId o review.autor pueden venir como objeto (por populate) o como string
    if (typeof review.userId === 'object' && review.userId) {
      return review.userId._id === currentUserId;
    }
    if (typeof review.autor === 'object' && review.autor) {
      return review.autor._id === currentUserId;
    }
    return review.userId === currentUserId || review.autor === currentUserId;
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
    if (!user || !review || !review.likedReview) return false;
    return review.likedReview.some(like => {
      if (like && typeof like.id_liked_review === 'object' && like.id_liked_review) {
        return like.id_liked_review._id === currentUserId;
      }
      return like && like.id_liked_review === currentUserId;
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
        if (getActualReviewId(r) === reviewId) {
          const hasLiked = hasUserLikedReview(r);
          
          if (hasLiked) {
            // Quitamos el like
            return {
              ...r,
              likedReview: r.likedReview ? r.likedReview.filter(like => {
                if (like && typeof like.id_liked_review === 'object' && like.id_liked_review) {
                  return like.id_liked_review._id !== currentUserId;
                }
                return like && like.id_liked_review !== currentUserId;
              }) : []
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
      itemId: album._id,
      review_txt: newReview,
      rating: rating,
      onModel: 'Album'
    };

    try {
      const response = await api.post("/api/reviews", reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Añade la reseña creada al inicio de la lista
      setReviews(prev => {
        const newReviewItem = response.data.review;
        const newReviewId = getActualReviewId(newReviewItem);
        // Asegura que no haya duplicados
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
  const handleEditClick = (review) => {
    setIsEditing(true);
    setEditReviewText(review.review_txt);
    setEditRating(review.rating);
    setEditingReviewId(getActualReviewId(review));
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
      const response = await api.put(`/api/reviews/${editingReviewId}`, {
        review_txt: editReviewText,
        rating: editRating
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setReviews(reviews.map(review => 
        getActualReviewId(review) === editingReviewId ? response.data : review
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
        await api.delete(`/api/reviews/${userReviewId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setReviews(prev => prev.filter(review => getActualReviewId(review) !== userReviewId));
      } catch (error) {
        console.error("Error al eliminar la reseña:", error);
      }
    }
  };

  // Función para mostrar nombre de usuario de forma segura
  const getUserDisplayName = (userObj) => {
    // Manejar objeto de usuario directo o denormalizado
    if (!userObj) return "Usuario";
    // Si viene como argumento directo (ej. user del contexto)
    if (userObj.nombre) return userObj.nombre;
    // Si viene dentro de una reseña (denormalizado)
    if (userObj.username) return userObj.username;
    
    return userObj.email || userObj.username || "Usuario";
  };

  // Función para obtener el ID de usuario desde el objeto de reseña
  const getUserId = (review) => {
    if (!review || !review.userId) return null;
    
    if (typeof review.userId === 'object') {
      return review.userId?._id;
    }
    return review.userId;
  };

  // Función para obtener el texto de la reseña teniendo en cuenta los aliases
  const getReviewText = (review) => {
    return review.review_txt || review.contenido || '';
  };

  // Función para obtener la calificación teniendo en cuenta los aliases
  const getReviewRating = (review) => {
    return review.rating || review.calificacion || 0;
  };

  // Función para obtener la fecha de la reseña
  const getReviewDate = (review) => {
    return review.fechaReview || review.createdAt || new Date();
  };

  // Función para obtener el autor de la reseña teniendo en cuenta los aliases
  const getReviewAuthor = (review) => {
    if (typeof review.userId === 'object' && review.userId) {
      return review.userId;
    }
    if (typeof review.autor === 'object' && review.autor) {
      return review.autor;
    }
    return null;
  };

  // Filtrar y ordenar reseñas según los filtros seleccionados
  const getFilteredReviews = () => {
    let filtered = [...reviews];
    if (ratingFilter === 'highRated') {
      filtered.sort((a, b) => getReviewRating(b) - getReviewRating(a));
    } else if (ratingFilter === 'lowRated') {
      filtered.sort((a, b) => getReviewRating(a) - getReviewRating(b));
    } else {
      filtered.sort((a, b) => {
        const dateA = new Date(getReviewDate(a));
        const dateB = new Date(getReviewDate(b));
        return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
      });
    }
    return filtered;
  };

  return (
    <div className="album-reviews">
      {/* Nombre del álbum destacado */}
      <div className="album-title-bar">
        <h3 className="album-title">{albumName}</h3>
      </div>
      {/* Barra de filtros horizontal y compacta */}
      <div className="review-filters-bar">
        <ReviewFilters 
          sortOption={sortOption}
          setSortOption={setSortOption}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
        />
      </div>

      {/* Si el álbum no tiene _id, mostrar mensaje */}
      {!canReview && (
        <p className="no-reviews">Debes agregar este álbum a tu colección antes de poder reseñar o ver reseñas.</p>
      )}

      {/* Si el usuario está autenticado y no tiene reseña publicada, se muestra el formulario de creación */}
      {canReview && user && !userReview && !isEditing && (
        <form onSubmit={handleSubmit} className="review-form">
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
      {canReview && user && userReview && (
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
                  {new Date(getReviewDate(userReview)).toLocaleDateString("es-ES")}
                </span>
              </div>
              <p className="review-text">{getReviewText(userReview)}</p>
              <div className="review-rating">
                {displayStars(getReviewRating(userReview))}
              </div>
              <div className="review-actions">
                <button onClick={() => handleEditClick(userReview)} className="edit-button">Editar Reseña</button>
                <button onClick={handleDelete} className="delete-button">Eliminar Reseña</button>
              </div>

              {/* Contador de likes para la reseña del usuario */}
              <div className="review-likes">
                <span className="likes-count">
                  {userReview.likedReview?.length || userReview.likes || 0} Me gusta
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
      {canReview && (loadingReviews ? (
        <p>Cargando reseñas...</p>
      ) : getFilteredReviews().length > 0 ? (
        <div className="reviews-list">
          {getFilteredReviews()
            .filter(review => {
              if (!user || !review) return true;
              // Filtrar con ambos campos de usuario
              if (typeof review.userId === 'object' && review.userId) {
                return review.userId._id !== currentUserId;
              }
              if (typeof review.autor === 'object' && review.autor) {
                return review.autor._id !== currentUserId;
              }
              return review.userId !== currentUserId && review.autor !== currentUserId;
            })
            .map((review) => {
              const reviewId = getActualReviewId(review);
              return (
              <div key={reviewId} className="review-card">
                <div className="review-header">
                  <div className="review-user-info">
                    <img 
                      src={review.userAvatar || (typeof getReviewAuthor(review) === 'object' ? getReviewAuthor(review)?.imagenPerfil : null) || 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'} 
                      alt="Avatar" 
                      className="review-avatar"
                      onError={(e) => e.target.src = 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'}
                    />
                    <div className="review-meta">
                      <Link to={`/perfil/${review.username || getUserDisplayName(getReviewAuthor(review))}`} className="user-link">
                        <strong>{review.username || getUserDisplayName(getReviewAuthor(review))}</strong>
                      </Link>
                      <span className="review-date">
                        {new Date(getReviewDate(review)).toLocaleDateString("es-ES")}
                      </span>
                      {review.estado && review.estado !== 'Activo' && (
                        <span className="review-status">Estado: {review.estado}</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="review-text">{getReviewText(review)}</p>
                <div className="review-rating">
                  {displayStars(getReviewRating(review))}
                </div>
                
                {/* Botón de Like y contador para reseñas */}
                <div className="review-likes-section">
                  <button 
                    className={`like-button ${hasUserLikedReview(review) ? 'liked' : ''}`}
                    onClick={() => handleReviewLikeToggle(review)}
                    disabled={!user || review.estado !== 'Activo'}
                    title={!user ? "Inicia sesión para dar me gusta" : 
                           review.estado !== 'Activo' ? "Esta reseña no está activa" :
                           hasUserLikedReview(review) ? "Quitar me gusta" : "Me gusta"}
                  >
                    {hasUserLikedReview(review) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                    <span>{review.likedReview?.length || review.likes || 0}</span>
                  </button>
                </div>
                
                {/* Sección de comentarios */}
                <div className="review-comments-section">
                  <button 
                    className="toggle-comments-button"
                    onClick={() => toggleComments(reviewId)}
                    disabled={review.estado !== 'Activo'}
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
        <p className="no-reviews">No hay reseñas aún. ¡Sé el primero en reseñar este álbum!</p>
      ))}

      {/* Mensaje para usuarios no autenticados */}
      {canReview && !user && (
        <div className="login-prompt">
          <p>Inicia sesión para dejar tu reseña y puntuar este álbum.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;