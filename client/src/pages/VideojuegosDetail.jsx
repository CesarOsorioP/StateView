import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHeart, FaRegHeart, FaGamepad
} from 'react-icons/fa';
import ReviewSection from '../components//Videojuegos/ReviewSection';
import "./pageStyles/VideojuegosDetail.css";
import api from '../api/api';

const GameDetail = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);

  // Estados para "me gusta" y "ya jugado"
  const [liked, setLiked] = useState(false);
  const [played, setPlayed] = useState(false);

  // Obtener detalles del videojuego
  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        const response = await api.get(`/api/videojuego/${gameId}`);
        setGame(response.data);
        const userId = localStorage.getItem('userId');
        if (userId) {
          try {
            // Historial (jugado)
            const historialResponse = await api.get(`/api/persona/${userId}/historial`);
            const historialData = Array.isArray(historialResponse.data) ? historialResponse.data : [];
            const isPlayed = historialData.some(item => item.contenido_id === response.data.juego_id && item.tipo === 'Videojuego');
            setPlayed(isPlayed);

            // Me gusta
            const megustaResponse = await api.get(`/api/persona/${userId}/megusta`);
            const megustaData = Array.isArray(megustaResponse.data) ? megustaResponse.data : [];
            const isLiked = megustaData.some(item => item.contenido_id === response.data.juego_id && item.tipo === 'Videojuego');
            setLiked(isLiked);
          } catch (error) {
            console.error("Error fetching user preferences:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      } finally {
        setLoadingGame(false);
      }
    };
    fetchGameDetail();
  }, [gameId]);

  const handlePlayedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!played) {
        await api.post(`/api/persona/${userId}/historial`, { contenido_id: game.juego_id, tipo: 'Videojuego' });
      } else {
        await api.delete(`/api/persona/${userId}/historial`, { data: { contenido_id: game.juego_id, tipo: 'Videojuego' } });
      }
      setPlayed(!played);
    } catch (error) {
      setPlayed(played);
    }
  };

  const handleLikedToggle = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Debes iniciar sesión para realizar esta acción.');
    try {
      if (!liked) {
        await api.post(`/api/persona/${userId}/megusta`, { contenido_id: game.juego_id, tipo: 'Videojuego' });
      } else {
        await api.delete(`/api/persona/${userId}/megusta`, { data: { contenido_id: game.juego_id, tipo: 'Videojuego' } });
      }
      setLiked(!liked);
    } catch (error) {
      setLiked(liked);
    }
  };

  return (
    <div className="game-detail-page">
      {loadingGame ? (
        <p>Cargando detalles del videojuego...</p>
      ) : game ? (
        <div className="game-info">
          <img src={game.imagen} alt={game.titulo} className="game-cover" />
          <div className="game-meta">
            <h2>{game.titulo}</h2>
            <p><strong>Desarrollador: </strong>{game.desarrolladora}</p>
            <p><strong>Plataformas: </strong>{game.plataformas}</p>
            <p><strong>Género: </strong>{game.genero}</p>
            <p>
              <strong>Fecha de lanzamiento: </strong>
              {new Date(game.fecha_lanzamiento).toLocaleDateString("es-ES", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            {/* Botones de Me gusta y Ya jugado */}
            {user && (
              <div className="game-actions">
                <button 
                  className={`action-button ${liked ? 'active' : ''}`}
                  onClick={handleLikedToggle}
                  title={liked ? "Quitar me gusta" : "Me gusta"}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{liked ? "Me gusta" : "Me gusta"}</span>
                </button>
                
                <button 
                  className={`action-button ${played ? 'active' : ''}`}
                  onClick={handlePlayedToggle}
                  title={played ? "Marcar como no jugado" : "Marcar como jugado"}
                >
                  <FaGamepad />
                  <span>{played ? "Jugado" : "Marcar como jugado"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>Videojuego no encontrado</p>
      )}

      <hr />

      {/* Componente ReviewSection que maneja toda la lógica de reseñas */}
      {game && <ReviewSection gameId={gameId} game={game} />}
    </div>
  );
};

export default GameDetail;