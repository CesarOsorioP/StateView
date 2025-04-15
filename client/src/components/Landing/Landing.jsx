// src/pages/Landing.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Landing.css";

// Imágenes de portada para usuarios no autenticados
const heroImages = [
  require("../../images/dune.avif"),
  require("../../images/interstellar.png"),
  require("../../images/bladerunner.jpg"),
];

// Datos de ejemplo para contenido cuando el usuario está autenticado
const popularMovies = [
  {
    id: 1,
    title: "Dune: Part Two",
    year: 2024,
    rating: 4.5,
    poster: require("../../images/dune.avif"),
  },
  {
    id: 2,
    title: "Interstellar",
    year: 2014,
    rating: 4.8,
    poster: require("../../images/interstellar.png"),
  },
  {
    id: 3,
    title: "Blade Runner 2049",
    year: 2017,
    rating: 4.3,
    poster: require("../../images/bladerunner.jpg"),
  },
  // Agrega más películas según necesites
];

const recentReviews = [
  {
    id: 1,
    username: "cinephile84",
    title: "Dune: Part Two",
    rating: 4.5,
    content:
      "Una secuela que expande el universo de la primera parte con impresionantes efectos visuales y una narrativa envolvente.",
    date: "2024-04-10",
    likes: 24,
    comments: 5,
    poster: require("../../images/dune.avif"),
  },
  {
    id: 2,
    username: "filmcritic22",
    title: "Interstellar",
    rating: 5.0,
    content:
      "Obra maestra de Nolan que combina la ciencia ficción con emociones humanas de manera brillante.",
    date: "2024-04-08",
    likes: 42,
    comments: 8,
    poster: require("../../images/interstellar.png"),
  },
  // Agrega más reseñas según necesites
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      const interval = setInterval(() => {
        setCurrentImage((prevImage) => (prevImage + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Vista para usuarios NO autenticados
  const GuestView = () => (
    <div className="landing-page">
      <div
        className="hero"
        style={{ backgroundImage: `url(${heroImages[currentImage]})` }}
      >
        <div className="hero-content">
          <h1>Explora, Comparte y Descubre.</h1>
          <h3>
            Descubre nuevas historias recomendadas por una comunidad apasionada
            por el entretenimiento.
          </h3>
          <Link to="/signup" className="cta-button">
            Únete ahora y comparte tu opinión
          </Link>
        </div>
      </div>
    </div>
  );

  // Vista para usuarios autenticados (estilo Letterboxd)
  const AuthenticatedView = () => (
    <div className="authenticated-landing">
      <div className="welcome-banner">
        <h2>Bienvenido de vuelta, {user.email.split("@")[0]}</h2>
        <p>Continúa explorando y compartiendo tus opiniones</p>
      </div>

      <section className="content-section">
        <div className="section-header">
          <h3>Popular ahora</h3>
          <Link to="/popular" className="view-all">
            Ver todo
          </Link>
        </div>
        <div className="movie-grid">
          {popularMovies.map((movie) => (
            <div key={movie.id} className="movie-card">
              <div className="poster-container">
                <img src={movie.poster} alt={movie.title} className="poster" />
                <div className="movie-rating">{movie.rating}</div>
              </div>
              <h4>{movie.title}</h4>
              <p className="movie-year">{movie.year}</p>
              <div className="card-actions">
                <button className="action-button">
                  <i className="far fa-heart"></i>
                </button>
                <button className="action-button">
                  <i className="far fa-bookmark"></i>
                </button>
                <button className="action-button">
                  <i className="far fa-star"></i> Calificar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h3>Reseñas recientes</h3>
          <Link to="/reviews" className="view-all">
            Ver todas
          </Link>
        </div>
        <div className="reviews-container">
          {recentReviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-user">
                  <div className="user-avatar-small">
                    {review.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="username">{review.username}</span>
                </div>
                <span className="review-date">{review.date}</span>
              </div>
              <div className="review-content">
                <div className="review-media">
                  <img
                    src={review.poster}
                    alt={review.title}
                    className="review-poster"
                  />
                  <div className="media-info">
                    <h4>{review.title}</h4>
                    <div className="star-rating">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fas fa-star ${
                            i < Math.floor(review.rating) ? "filled" : ""
                          }`}
                        ></i>
                      ))}
                      <span>{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <p className="review-text">{review.content}</p>
                <div className="review-actions">
                  <button className="review-action">
                    <i className="far fa-heart"></i> {review.likes}
                  </button>
                  <button className="review-action">
                    <i className="far fa-comment"></i> {review.comments}
                  </button>
                  <button className="review-action">
                    <i className="fas fa-share"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h3>Categorías</h3>
        </div>
        <div className="categories-grid">
          <Link to="/peliculas" className="category-card">
            <div className="category-icon">🎬</div>
            <h4>Películas</h4>
          </Link>
          <Link to="/series" className="category-card">
            <div className="category-icon">📺</div>
            <h4>Series</h4>
          </Link>
          <Link to="/videojuegos" className="category-card">
            <div className="category-icon">🎮</div>
            <h4>Videojuegos</h4>
          </Link>
          <Link to="/albumes" className="category-card">
            <div className="category-icon">🎵</div>
            <h4>Álbumes</h4>
          </Link>
        </div>
      </section>
    </div>
  );

  return user ? <AuthenticatedView /> : <GuestView />;
};

export default Landing;
