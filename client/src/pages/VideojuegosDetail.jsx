import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
        const response = await api.get(`/api/videojuegos/${gameId}`);
        setGame(response.data);
        
        // Verificar si el usuario tiene marcado como "me gusta" o "ya jugado"
        if (user) {
          try {
            const userPrefsResponse = await api.get(
              `/api/gamePreferences/${gameId}`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            if (userPrefsResponse.data) {
              setLiked(userPrefsResponse.data.liked || false);
              setPlayed(userPrefsResponse.data.played || false);
            }
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
  }, [gameId, user]);

  // Función para actualizar "me gusta" y "ya jugado"
  const handlePreferenceToggle = async (type) => {
    if (!user) {
      alert("Debes iniciar sesión para realizar esta acción.");
      return;
    }

    try {
      let updatedValue;
      if (type === 'liked') {
        updatedValue = !liked;
        setLiked(updatedValue);
      } else if (type === 'played') {
        updatedValue = !played;
        setPlayed(updatedValue);
      }

      await api.post(
        `/api/gamePreferences/${gameId}`,
        { [type]: updatedValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error(`Error updating ${type} preference:`, error);
      // Revertir el cambio visual en caso de error
      if (type === 'liked') setLiked(!liked);
      else if (type === 'played') setPlayed(!played);
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
                  onClick={() => handlePreferenceToggle('liked')}
                  title={liked ? "Quitar me gusta" : "Me gusta"}
                >
                  {liked ? <FaHeart /> : <FaRegHeart />}
                  <span>{liked ? "Me gusta" : "Me gusta"}</span>
                </button>
                
                <button 
                  className={`action-button ${played ? 'active' : ''}`}
                  onClick={() => handlePreferenceToggle('played')}
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