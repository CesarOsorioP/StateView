import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FaThumbsUp, FaRegThumbsUp, FaEdit, FaTrash, FaCheck, FaTimes
} from 'react-icons/fa';
import './commentSection.css';
import api from '../../api/api'


const CommentSection = ({ reviewId, toggleComments }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  
  // Estados para edición
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // Cargar comentarios - useCallback para evitar recrear la función en cada render
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/comments?reviewId=${reviewId}`);
      setComments(response.data);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);
  
  // Verificar si el usuario ha dado like a un comentario
  const hasUserLikedComment = (comment) => {
    if (!user || !comment.liked_comment) return false;
    return comment.liked_comment.some(like => {
      if (typeof like.id_liked_comment === 'object') {
        return like.id_liked_comment._id === currentUserId;
      }
      return like.id_liked_comment === currentUserId;
    });
  };

  // Función para dar/quitar like a un comentario
  const handleCommentLikeToggle = async (commentId) => {
    if (!user) {
      alert("Debes iniciar sesión para dar 'me gusta'.");
      return;
    }

    try {
      // Actualizamos la UI optimísticamente
      const updatedComments = comments.map(comment => {
        if (comment._id === commentId) {
          const hasLiked = hasUserLikedComment(comment);
          
          if (hasLiked) {
            // Quitamos el like
            return {
              ...comment,
              liked_comment: comment.liked_comment.filter(like => {
                if (typeof like.id_liked_comment === 'object') {
                  return like.id_liked_comment._id !== currentUserId;
                }
                return like.id_liked_comment !== currentUserId;
              })
            };
          } else {
            // Añadimos el like
            return {
              ...comment,
              liked_comment: [
                ...(comment.liked_comment || []),
                {
                  id_liked_comment: currentUserId,
                  nombre_persona_comment: user.nombre || user.email || "Usuario",
                  id_persona_comment: currentUserId
                }
              ]
            };
          }
        }
        return comment;
      });
      
      setComments(updatedComments);
      
      // Llamada a la API
      const commentToUpdate = comments.find(c => c._id === commentId);
      const hasLiked = hasUserLikedComment(commentToUpdate);
      
      if (hasLiked) {
        // Si ya tiene like, lo quitamos
        await api.delete(`/api/comments/${commentId}/unlike`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        // Si no tiene like, lo añadimos
        await api.post(`/api/comments/${commentId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
    } catch (error) {
      console.error("Error al cambiar el estado del like del comentario:", error);
      // En caso de error, recargamos los comentarios
      loadComments();
    }
  };

  // Función para enviar un nuevo comentario
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para comentar.");
      return;
    }

    if (!newComment || newComment.trim() === '') {
      alert("El comentario no puede estar vacío.");
      return;
    }

    try {
      const response = await api.post(
        "/api/comments",
        { reviewId, comment_txt: newComment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Añadir el nuevo comentario
      const addedComment = response.data.comment;
      setComments(prev => [addedComment, ...prev]);
      
      // Limpiar el formulario
      setNewComment('');
    } catch (error) {
      if (error.response && error.response.data.existingComment) {
        alert("Ya has comentado en esta reseña. Puedes editar tu comentario existente.");
        
        // Opcional: Hacer scroll hasta el comentario existente
        const existingCommentElement = document.getElementById(`comment-${error.response.data.existingComment._id}`);
        if (existingCommentElement) {
          existingCommentElement.scrollIntoView({ behavior: 'smooth' });
          existingCommentElement.classList.add('highlight-comment');
          setTimeout(() => {
            existingCommentElement.classList.remove('highlight-comment');
          }, 3000);
        }
      } else {
        console.error("Error al enviar comentario:", error);
        alert("Error al enviar el comentario. Inténtalo de nuevo.");
      }
    }
  };

  // Función para iniciar la edición de un comentario
  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.comment_txt);
  };

  // Función para cancelar la edición
  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // Función para guardar los cambios de la edición
  const saveCommentEdit = async (commentId) => {
    if (!editCommentText || editCommentText.trim() === '') {
      alert("El comentario no puede estar vacío.");
      return;
    }

    try {
      const response = await api.put(
        `/api/comments/${commentId}`,
        { comment_txt: editCommentText },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Actualizar el comentario en el estado local
      const updatedComment = response.data.comment;
      setComments(prev => prev.map(comment => 
        comment._id === commentId ? updatedComment : comment
      ));
      
      // Resetear estado de edición
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error("Error al actualizar comentario:", error);
      alert("Error al actualizar el comentario. Inténtalo de nuevo.");
    }
  };

  // Función para eliminar un comentario
  const deleteComment = async (commentId) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) {
      return;
    }

    try {
      await api.delete(`/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Eliminar el comentario del estado local
      setComments(prev => prev.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      alert("Error al eliminar el comentario. Inténtalo de nuevo.");
    }
  };

  // Verificar si el usuario es el autor del comentario
  const isCommentOwner = (comment) => {
    if (!user) return false;
    
    if (typeof comment.userId === 'object') {
      return comment.userId._id === currentUserId;
    }
    return comment.userId === currentUserId;
  };

  // Verificar si el usuario ya ha comentado en esta reseña
  const hasUserCommented = () => {
    if (!user) return false;
    return comments.some(comment => isCommentOwner(comment));
  };

  return (
    <div className="comments-container">
      {/* Formulario para añadir comentario (solo si el usuario no ha comentado aún) */}
      {user && !hasUserCommented() && (
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            required
          />
          <button type="submit" disabled={!newComment.trim()}>
            Comentar
          </button>
        </form>
      )}
      
      {/* Lista de comentarios */}
      {loading ? (
        <p className="loading-message">Cargando comentarios...</p>
      ) : comments.length > 0 ? (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment._id} id={`comment-${comment._id}`} className="comment-item">
              <div className="comment-header">
                <strong>
                  {typeof comment.userId === 'object' 
                    ? comment.userId.email || comment.userId.username 
                    : "Usuario"}
                </strong>
                <span className="comment-date">
                  {new Date(comment.commentDate).toLocaleDateString("es-ES")}
                  {comment.isEdited && <span className="edited-label"> (editado)</span>}
                </span>
              </div>

              {editingCommentId === comment._id ? (
                <div className="edit-comment-form">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    required
                  />
                  <div className="edit-actions">
                    <button 
                      className="save-button"
                      onClick={() => saveCommentEdit(comment._id)}
                      disabled={!editCommentText.trim()}
                    >
                      <FaCheck /> Guardar
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={cancelEditingComment}
                    >
                      <FaTimes /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.comment_txt}</p>
              )}
              
              <div className="comment-actions">
                {/* Botón de like */}
                <button 
                  className={`like-button ${hasUserLikedComment(comment) ? 'liked' : ''}`}
                  onClick={() => handleCommentLikeToggle(comment._id)}
                  disabled={!user}
                  title={user ? (hasUserLikedComment(comment) ? "Quitar me gusta" : "Me gusta") : "Inicia sesión para dar me gusta"}
                >
                  {hasUserLikedComment(comment) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                  <span>{comment.liked_comment?.length || 0}</span>
                </button>

                {/* Botones de editar y eliminar (solo para el autor) */}
                {isCommentOwner(comment) && editingCommentId !== comment._id && (
                  <div className="owner-actions">
                    <button 
                      className="edit-button"
                      onClick={() => startEditingComment(comment)}
                      title="Editar comentario"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => deleteComment(comment._id)}
                      title="Eliminar comentario"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-comments">No hay comentarios aún.</p>
      )}
    </div>
  );
};

export default CommentSection;