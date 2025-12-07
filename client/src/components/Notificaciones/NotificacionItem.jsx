import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './NotificacionItem.css';

const NotificacionItem = ({ notificacion, onMarkAsRead }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notificacion.leida) {
      onMarkAsRead(notificacion._id);
    }

    // Navegar según el tipo de referencia
    switch (notificacion.referencia.tipo) {
      case 'reseña':
        navigate(`/reseña/${notificacion.referencia.id}`);
        break;
      case 'comentario':
        navigate(`/reseña/${notificacion.referencia.id}`);
        break;
      case 'usuario':
        navigate(`/perfil/${notificacion.emisor.nombre}`);
        break;
      default:
        break;
    }
  };

  const getIcon = () => {
    switch (notificacion.tipo) {
      case 'like':
        return '❤️';
      case 'comentario':
        return '💬';
      case 'seguidor':
        return '👥';
      default:
        return '📢';
    }
  };

  return (
    <div 
      className={`notificacion-item ${notificacion.leida ? 'leida' : ''}`}
      onClick={handleClick}
    >
      <div className="notificacion-icon">
        {getIcon()}
      </div>
      <div className="notificacion-content">
        <div className="notificacion-header">
          <img 
            src={notificacion.emisor.imagenPerfil || '/default-avatar.png'} 
            alt={notificacion.emisor.nombre}
            className="emisor-avatar"
          />
          <div className="notificacion-info">
            <p className="notificacion-texto">{notificacion.contenido}</p>
            <span className="notificacion-tiempo">
              {formatDistanceToNow(new Date(notificacion.fecha), { 
                addSuffix: true,
                locale: es 
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificacionItem; 