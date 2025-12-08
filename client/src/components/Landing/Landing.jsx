// src/pages/Landing.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Landing.css";
import api from "../../api/api"; // Importamos la API

// Imágenes de portada para usuarios no autenticados
const heroImages = [
  require("../../images/dune.avif"),
  require("../../images/interstellar.png"),
  require("../../images/bladerunner.jpg"),
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const { user } = useAuth();
  
  // Estados para datos reales
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [popularAlbums, setPopularAlbums] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const interval = setInterval(() => {
        setCurrentImage((prevImage) => (prevImage + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Cargar datos reales cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
          console.log("Iniciando carga de datos...");

          // 1. Cargar Películas
          try {
            const moviesRes = await api.get("/api/pelicula"); // CORREGIDO: singular
            console.log("Películas cargadas:", moviesRes.data?.length);
            if (moviesRes.data && moviesRes.data.length > 0) {
              const sortedMovies = moviesRes.data.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
              setPopularMovies(sortedMovies.slice(0, 25).map(m => ({
                id: m.pelicula_id, // CORREGIDO: Usar ID externo
                title: m.titulo,
                year: m.fecha_estreno ? new Date(m.fecha_estreno).getFullYear() : "N/A",
                rating: m.calificacion || 0,
                poster: m.imagen || require("../../images/dune.avif"),
                type: 'pelicula'
              })));
            }
          } catch (e) { console.error("Error cargando películas", e); }

          // 2. Cargar Series
          try {
            const seriesRes = await api.get("/api/serie");
            console.log("Series cargadas:", seriesRes.data?.length);
            if (seriesRes.data && seriesRes.data.length > 0) {
               const sortedSeries = seriesRes.data.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
               setPopularSeries(sortedSeries.slice(0, 20).map(s => ({
                 id: s.serie_id, // CORREGIDO: Usar ID externo
                 title: s.titulo,
                 year: s.fechaInicio ? new Date(s.fechaInicio).getFullYear() : (s.fecha_estreno ? new Date(s.fecha_estreno).getFullYear() : "N/A"),
                 rating: s.averageRating || 0,
                 poster: s.poster || require("../../images/interstellar.png"), // CORREGIDO: usar s.poster
                 type: 'serie'
               })));
            }
          } catch (e) { console.error("Error cargando series", e); }

          // 3. Cargar Videojuegos
          try {
            const gamesRes = await api.get("/api/videojuego");
            console.log("Videojuegos cargados:", gamesRes.data?.length);
            if (gamesRes.data && gamesRes.data.length > 0) {
               const sortedGames = gamesRes.data.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
               setPopularGames(sortedGames.slice(0, 20).map(g => ({
                 id: g.juego_id, // CORREGIDO: Usar ID externo
                 title: g.titulo,
                 year: g.fecha_lanzamiento ? new Date(g.fecha_lanzamiento).getFullYear() : "N/A",
                 rating: g.calificacion || 0,
                 poster: g.imagen || require("../../images/bladerunner.jpg"),
                 type: 'videojuego'
               })));
            }
          } catch (e) { console.error("Error cargando videojuegos", e); }

          // 4. Cargar Álbumes
          try {
            const albumsRes = await api.get("/api/album");
            console.log("Álbumes raw:", albumsRes.data); // Debug
            
            // Verificamos si la respuesta es un array directo o un objeto con data
            const albumsData = Array.isArray(albumsRes.data) ? albumsRes.data : (albumsRes.data.data || []);
            
            if (albumsData && albumsData.length > 0) {
               const sortedAlbums = albumsData.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
               setPopularAlbums(sortedAlbums.slice(0, 20).map(a => ({
                 id: a.album_id, // CORREGIDO: Usar ID externo
                 title: a.nombre, // CORREGIDO: usar a.nombre
                 year: a.fecha_estreno ? new Date(a.fecha_estreno).getFullYear() : "N/A",
                 rating: a.averageRating || 0,
                 poster: a.portada || require("../../images/dune.avif"), // CORREGIDO: usar a.portada
                 type: 'album'
               })));
            }
          } catch (e) { console.error("Error cargando álbumes", e); }

          // 5. Cargar Reseñas Recientes
          try {
            const reviewsRes = await api.get("/api/reviews");
            // console.log("Reseñas recibidas del backend:", reviewsRes.data); // Descomentar para debug
            
            if (reviewsRes.data && Array.isArray(reviewsRes.data)) {
              // Validamos que tenga itemId poblado
              const validReviews = reviewsRes.data.filter(r => r.itemId && (r.itemId.titulo || r.itemId.nombre));
              console.log(`Total reseñas válidas: ${validReviews.length}`);
              
              // Función para mezclar el array (Fisher-Yates shuffle)
              const shuffleArray = (array) => {
                for (let i = array.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
              };

              // Mezclamos las reseñas
              const shuffledReviews = shuffleArray([...validReviews]);
              
              setRecentReviews(shuffledReviews.slice(0, 6).map(r => {
                const item = r.itemId || {};
                
                // Lógica robusta para encontrar la imagen
                // Buscamos en todos los campos posibles de imagen
                let posterImage = item.imagen || item.poster || item.portada || item.cover;
                
                // Si aún no hay imagen, intentamos buscarla en la estructura interna si existe
                if (!posterImage && item._doc) {
                    posterImage = item._doc.imagen || item._doc.poster || item._doc.portada;
                }

                // Debug para imágenes fallidas
                if (!posterImage) {
                    console.log(`Falta imagen para reseña ID: ${r._id}, Modelo: ${r.onModel}, Item:`, item);
                }

                // Determinar link correcto
                let targetLink = "#";
                if (r.onModel === 'Pelicula') targetLink = `/peliculas/${item.pelicula_id}`;
                else if (r.onModel === 'Serie') targetLink = `/series/${item.serie_id}`;
                else if (r.onModel === 'Videojuego') targetLink = `/videojuegos/${item.juego_id}`;
                else if (r.onModel === 'Album') targetLink = `/albumes/${item.album_id}`;

                return {
                  id: r._id,
                  username: r.userId ? (r.userId.nombre || r.userId.username || "Usuario") : "Anónimo",
                  userAvatar: r.userId?.imagenPerfil || r.userId?.avatar || null, // CORREGIDO: usar imagenPerfil
                  title: item.titulo || item.nombre || "Título desconocido",
                  rating: r.rating,
                  content: r.review_txt,
                  date: new Date(r.createdAt || r.fechaReview).toLocaleDateString(),
                  likes: r.likedReview ? r.likedReview.length : 0,
                  comments: r.comments ? r.comments.length : 0,
                  poster: posterImage || require("../../images/bladerunner.jpg"), // Fallback final
                  model: r.onModel,
                  targetLink: targetLink
                };
              }));
            }
          } catch (err) {
            console.error("Error cargando reseñas", err);
          }

        } catch (error) {
          console.error("Error general cargando datos:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  // Vista para usuarios NO autenticados (Diseño Original Restaurado)
  const GuestView = () => (
    <div className="landing-page guest-mode-original">
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

  // Componente reutilizable para carruseles
  const MediaCarousel = ({ title, items, linkTo, icon }) => {
    const scrollerRef = React.useRef(null);

    if (!items || items.length === 0) return null;

    // Duplicamos la lista para simular loop infinito visual
    const loopItems = [...items, ...items];
    
    const handleNext = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const firstCard = scroller.querySelector('.media-card');
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 220;
      const gap = 16; // coincide con el gap en CSS
      const step = cardWidth + gap;
      scroller.scrollBy({ left: step * 2, behavior: 'smooth' });

      // Bucle infinito: si superamos el ancho de los ítems originales, saltar hacia atrás sin animación.
      const totalSpan = step * items.length;
      setTimeout(() => {
        if (scroller.scrollLeft >= totalSpan) {
          scroller.scrollLeft = scroller.scrollLeft - totalSpan;
        }
      }, 450);
    };

    const handlePrev = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const firstCard = scroller.querySelector('.media-card');
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 220;
      const gap = 16;
      const step = cardWidth + gap;
      scroller.scrollBy({ left: -step * 2, behavior: 'smooth' });

      const totalSpan = step * items.length;
      setTimeout(() => {
        if (scroller.scrollLeft <= 0) {
          scroller.scrollLeft = scroller.scrollLeft + totalSpan;
        }
      }, 450);
    };

    return (
      <section className="content-section">
        <div className="section-header">
          <h3><i className={icon}></i> {title}</h3>
          <Link to={linkTo} className="view-all">Ver todas</Link>
        </div>
        
        <div className="media-scroller-wrapper">
          <button className="carousel-arrow prev" onClick={handlePrev} aria-label="Anterior">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div className="media-scroller" ref={scrollerRef}>
            {loopItems.map((item, idx) => (
              <Link to={`${linkTo}/${item.id}`} key={`${item.id}-${idx}`} className="media-card">
                <div className="poster-wrapper">
                  <img src={item.poster} alt={item.title} loading="lazy" />
                  <div className="overlay-info">
                    <span className="view-details">Ver detalles</span>
                  </div>
                </div>
                <div className="media-info">
                  <h4>{item.title}</h4>
                  <span className="year">{item.year}</span>
                </div>
              </Link>
            ))}
          </div>
          <button className="carousel-arrow" onClick={handleNext} aria-label="Siguiente">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
    );
  };

  // Función para obtener saludo según la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Vista para usuarios autenticados (Diseño Premium)
  const AuthenticatedView = () => (
    <div className="authenticated-landing">
      <div className="premium-hero">
        <div className="hero-glow"></div>
        <div className="hero-text-content">
          <span className="greeting-badge"> {getGreeting()}</span>
          <h2>{user.nombre.split("@")[0]}</h2>
          <p>¿Listo para tu próxima obsesión?</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Preparando tu cartelera...</p>
        </div>
      ) : (
        <>
          <div className="content-sections-wrapper">
            {/* Carruseles de contenido */}
            <MediaCarousel 
                title="Películas Destacadas" 
                items={popularMovies} 
                linkTo="/peliculas" 
                icon="fas fa-film" 
            />

            <MediaCarousel 
                title="Series Populares" 
                items={popularSeries} 
                linkTo="/series" 
                icon="fas fa-tv" 
            />

            <MediaCarousel 
                title="Videojuegos" 
                items={popularGames} 
                linkTo="/videojuegos" 
                icon="fas fa-gamepad" 
            />

            <MediaCarousel 
                title="Álbumes" 
                items={popularAlbums} 
                linkTo="/albumes" 
                icon="fas fa-music" 
            />
          </div>

          {/* Sección de Reseñas (Full Width) */}
          <section className="reviews-section-full">
            <div className="section-header">
              <h3><i className="fas fa-fire-alt"></i> Lo que dice la comunidad</h3>
            </div>
            
            <div className="reviews-grid-layout">
              {recentReviews.length > 0 ? (
                recentReviews.map((review) => (
                  <Link to={review.targetLink} key={review.id} className="review-card-premium">
                    <div className="card-backdrop" style={{backgroundImage: `url(${review.poster})`}}></div>
                    
                    {/* Header Fijo Arriba */}
                    <div className="review-header-fixed">
                        <div className="user-info-clean">
                            {review.userAvatar ? (
                              <img src={review.userAvatar} alt={review.username} className="avatar-img-mini" />
                            ) : (
                              <span className="avatar-mini">{review.username.charAt(0).toUpperCase()}</span>
                            )}
                            <span className="username-clean">{review.username}</span>
                        </div>
                        <div className="rating-stars-clean">
                            <i className="fas fa-star"></i> {review.rating}
                        </div>
                    </div>

                    {/* Contenido Abajo */}
                    <div className="card-content-bottom">
                        <h4 className="review-title-overlay">{review.title}</h4>
                        
                        <p className="review-snippet">
                            "{review.content.length > 80 ? review.content.substring(0, 80) + "..." : review.content}"
                        </p>
                        
                        <div className="review-footer-mini">
                            <span><i className="far fa-heart"></i> {review.likes}</span>
                            <span><i className="far fa-comment"></i> {review.comments}</span>
                        </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-state">
                  <p>Aún no hay reseñas. ¡Sé el primero en escribir una!</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );

  return user ? <AuthenticatedView /> : <GuestView />;
};

export default Landing;