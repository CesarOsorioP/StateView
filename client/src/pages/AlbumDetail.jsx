// src/pages/AlbumDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const AlbumDetail = () => {
  const { albumId } = useParams();
  const { user } = useAuth();
  const [album, setAlbum] = useState(null);
  const [loadingAlbum, setLoadingAlbum] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);

  // Obtener los detalles del álbum usando el endpoint GET /api/albums/:albumId
  useEffect(() => {
    const fetchAlbumDetail = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/albums/${albumId}`);
        setAlbum(response.data);
      } catch (error) {
        console.error("Error fetching album details:", error);
      } finally {
        setLoadingAlbum(false);
      }
    };
    fetchAlbumDetail();
  }, [albumId]);

  // Una vez que se cargue el álbum, obtenemos las reseñas filtrando por itemId = album._id
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (album && album._id) {
          const response = await axios.get(`http://localhost:5000/api/reviews?itemId=${album._id}`);
          setReviews(response.data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [album]);

  // Función para enviar la nueva reseña
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

    // Usar user.id o user._id para formar el campo userId
    const currentUserId = user.id || user._id;
    if (!currentUserId) {
      alert("Error: no se pudo identificar al usuario.");
      return;
    }

    const reviewData = {
      userId: currentUserId,
      itemId: album._id, // Se usa el _id real del álbum
      review_txt: newReview,
      rating: rating,
      onModel: "Album"    // Especificamos que este ítem es un Album
    };

    try {
      const response = await axios.post("http://localhost:5000/api/reviews", reviewData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Se espera que el endpoint devuelva { message, review }
      setReviews(prev => [response.data.review, ...prev]);
      setNewReview('');
      setRating(0);
    } catch (error) {
      console.error("Error al enviar la reseña:", error);
    }
  };

  return (
    <div className="album-detail-page">
      {loadingAlbum ? (
        <p>Cargando detalles del álbum...</p>
      ) : album ? (
        <div className="album-info">
          <img src={album.portada} alt={album.nombre} className="album-cover" />
          <div className="album-meta">
            <h2>{album.nombre}</h2>
            <p><strong>Artista: </strong>{album.artista?.nombre}</p>
            <p><strong>Fecha de estreno: </strong>{album.fecha_estreno}</p>
          </div>
        </div>
      ) : (
        <p>Álbum no encontrado</p>
      )}

      <hr />

      <div className="album-reviews">
        <h3>Reseñas</h3>

        {user && (
          <form onSubmit={handleReviewSubmit} className="review-form">
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Escribe tu reseña..."
              required
            />
            <div className="rating-input">
              <label>Calificación: </label>
              <input
                type="number"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                min="0"
                max="5"
                step="0.1"
                required
              />
            </div>
            <button type="submit">Publicar Reseña</button>
          </form>
        )}

        {loadingReviews ? (
          <p>Cargando reseñas...</p>
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <strong>{review.userId?.email || "Anónimo"}</strong>
                  <span className="review-date">
                    {new Date(review.fechaReview).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-text">{review.review_txt}</p>
                <p className="review-rating">Calificación: {review.rating}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay reseñas para este álbum.</p>
        )}
      </div>
    </div>
  );
};

export default AlbumDetail;
