import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaThumbsUp, FaRegThumbsUp, FaEdit, FaTrash, FaCheck, FaTimes, FaFlag
} from 'react-icons/fa';
import './commentSection.css';
import api from '../../api/api';
import ReportModal from '../Reportes/ReportModal';

const CommentSection = ({ reviewId, toggleComments }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  
  // Estados para edición
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  // Estados para el modal de reporte
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportedUserId, setReportedUserId] = useState(null);
  const [reportedCommentId, setReportedCommentId] = useState(null);
  
  // Cargar comentarios - useCallback para evitar recrear la función en cada render
  const loadComments = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/comment?reviewId=${reviewId}`);
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
    if (!user || !comment || !currentUserId) return false;
    
    // Si no hay liked_comment array, retornar false
    if (!comment.liked_comment || !Array.isArray(comment.liked_comment)) return false;
    
    return comment.liked_comment.some(like => {
      if (!like) return false;
      
      // Manejar diferentes formatos de id_liked_comment
      if (typeof like.id_liked_comment === 'object' && like.id_liked_comment) {
        // Puede ser ObjectId o objeto con _id
        const likeUserId = like.id_liked_comment._id || like.id_liked_comment;
        return likeUserId?.toString() === currentUserId.toString();
      }
      // Si es string o ObjectId directamente
      return like.id_liked_comment?.toString() === currentUserId.toString();
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
        const cId = getCommentId(comment);
        if (cId === commentId) {
          const hasLiked = hasUserLikedComment(comment);
          
          if (hasLiked) {
            // Quitamos el like
            return {
              ...comment,
              liked_comment: (comment.liked_comment || []).filter(like => {
                if (!like) return false;
                
                if (typeof like.id_liked_comment === 'object' && like.id_liked_comment) {
                  const likeUserId = like.id_liked_comment._id || like.id_liked_comment;
                  return likeUserId?.toString() !== currentUserId.toString();
                }
                return like.id_liked_comment?.toString() !== currentUserId.toString();
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
      const commentToUpdate = comments.find(c => getCommentId(c) === commentId);
      const originalComment = comments.find(c => getCommentId(c) === commentId);
      const wasLiked = hasUserLikedComment(originalComment);

      if (wasLiked) {
        await api.delete(`/api/comment/${commentId}/like`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await api.post(`/api/comment/${commentId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
    } catch (error) {
      console.error("Error al cambiar el estado del like del comentario:", error);
      loadComments(); // Revert on error
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
        "/api/comment",
        { reviewId, comment_txt: newComment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const addedComment = response.data.comment;
      setComments(prev => [addedComment, ...prev]);
      setNewComment('');
    } catch (error) {
      if (error.response && error.response.data.existingComment) {
        alert("Ya has comentado en esta reseña. Puedes editar tu comentario existente.");
      } else {
        console.error("Error al enviar comentario:", error);
        alert("Error al enviar el comentario. Inténtalo de nuevo.");
      }
    }
  };

  // Función para iniciar la edición de un comentario
  const startEditingComment = (comment) => {
    const commentId = getCommentId(comment);
    setEditingCommentId(commentId);
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
        `/api/comment/${commentId}`,
        { comment_txt: editCommentText },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const updatedComment = response.data.comment;
      setComments(prev => prev.map(comment => {
        const cId = getCommentId(comment);
        return cId === commentId ? updatedComment : comment;
      }));
      
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
      await api.delete(`/api/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setComments(prev => prev.filter(comment => getCommentId(comment) !== commentId));
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      alert("Error al eliminar el comentario. Inténtalo de nuevo.");
    }
  };

  // Función para abrir el modal de reporte
  const handleReportUser = (userId, commentId) => {
    if (!user) {
      alert("Debes iniciar sesión para reportar.");
      return;
    }
    
    setReportedUserId(userId);
    setReportedCommentId(commentId);
    setIsReportModalOpen(true);
  };

  // Helper para obtener el ID del comentario (maneja denormalización)
  const getCommentId = (comment) => {
    return comment.commentId || comment._id;
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

  // Obtener el ID de usuario de un comentario (ya sea objeto o string)
  const getCommentUserIdValue = (comment) => {
    if (typeof comment.userId === 'object') {
      return comment.userId._id;
    }
    return comment.userId;
  };

  // Helper para obtener el nombre de usuario
  const getCommentUserName = (comment) => {
    if (comment.username) return comment.username;
    if (typeof comment.userId === 'object' && comment.userId) {
      return comment.userId.nombre || comment.userId.username || comment.userId.email || 'Usuario';
    }
    return 'Usuario';
  };

  // Helper para obtener el avatar del usuario
  const getCommentUserAvatar = (comment) => {
    if (comment.userAvatar) return comment.userAvatar;
    if (typeof comment.userId === 'object' && comment.userId && comment.userId.imagenPerfil) {
      return comment.userId.imagenPerfil;
    }
    return 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png';
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
          {comments.map(comment => {
            const commentId = getCommentId(comment);
            return (
            <div key={commentId} id={`comment-${commentId}`} className="comment-item">
              <div className="comment-header">
                <div className="comment-user-info">
                  <img 
                    src={getCommentUserAvatar(comment)} 
                    alt="Avatar" 
                    className="comment-avatar"
                    onError={(e) => e.target.src = 'https://res.cloudinary.com/ds6vpl6yk/image/upload/v1734188668/avatar_default_q9qkso.png'}
                  />
                  <Link 
                    to={`/perfil/${getCommentUserName(comment)}`} 
                    className="user-link"
                  >
                    <strong>{getCommentUserName(comment)}</strong>
                  </Link>
                </div>
                <span className="comment-date">
                  {new Date(comment.fechaCreacion || comment.commentDate || comment.createdAt || Date.now()).toLocaleDateString("es-ES")}
                  {comment.isEdited && <span className="edited-label"> (editado)</span>}
                </span>
              </div>

              {editingCommentId === commentId ? (
                <div className="edit-comment-form">
                  <textarea
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    required
                  />
                  <div className="edit-actions">
                    <button 
                      className="save-button"
                      onClick={() => saveCommentEdit(commentId)}
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
                  onClick={() => handleCommentLikeToggle(commentId)}
                  disabled={!user}
                  title={user ? (hasUserLikedComment(comment) ? "Quitar me gusta" : "Me gusta") : "Inicia sesión para dar me gusta"}
                >
                  {hasUserLikedComment(comment) ? <FaThumbsUp /> : <FaRegThumbsUp />}
                  <span>{comment.liked_comment?.length || comment.likesCount || 0}</span>
                </button>

                {/* Botón de reporte (solo visible si no es el propietario) */}
                {user && !isCommentOwner(comment) && (
                  <button
                    className="report-button"
                    onClick={() => handleReportUser(getCommentUserIdValue(comment), commentId)}
                    title="Reportar usuario"
                  >
                    <FaFlag />
                  </button>
                )}

                {/* Botones de editar y eliminar (solo para el autor) */}
                {isCommentOwner(comment) && editingCommentId !== commentId && (
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
                      onClick={() => deleteComment(commentId)}
                      title="Eliminar comentario"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <p className="no-comments">No hay comentarios aún.</p>
      )}

      {/* Modal de reporte */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportedUserId(null);
          setReportedCommentId(null);
        }}
        reportedUserId={reportedUserId}
        reviewId={null}
        commentId={reportedCommentId}
      />
    </div>
  );
};

export default CommentSection;
