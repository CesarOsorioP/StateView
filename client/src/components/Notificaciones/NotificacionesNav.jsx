import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import api from '../../api/api';
import './NotificacionesNav.css';

const NotificacionesNav = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const [notificacionesRes, noLeidasRes] = await Promise.all([
        api.get('/api/notificaciones'),
        api.get('/api/notificaciones/no-leidas')
      ]);
      console.log('notificacionesRes:', notificacionesRes);
      console.log('notificacionesRes.data:', notificacionesRes.data);
      console.log('noLeidasRes.data:', noLeidasRes.data);

      if (Array.isArray(notificacionesRes.data.data)) {
        setNotificaciones(notificacionesRes.data.data);
      } else {
        console.error('API response for notifications is not an array:', notificacionesRes.data.data);
        setNotificaciones([]); // Asegurarse de que sea un array para evitar errores de .map
      }
      setNoLeidas(noLeidasRes.data.count);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest('.notificaciones-nav')) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}/leer`);
      setNotificaciones(notificaciones.map(notif => 
        notif._id === id ? { ...notif, leida: true } : notif
      ));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/api/notificaciones/leer-todas');
      setNotificaciones(notificaciones.map(notif => ({ ...notif, leida: true })));
      setNoLeidas(0);
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  return (
    <div className="notificaciones-nav">
      <div className="notificaciones-icon" onClick={handleClick}>
        <FaBell />
        {noLeidas > 0 && (
          <span className="notificaciones-badge">{noLeidas}</span>
        )}
      </div>

      {isOpen && (
        <div className="notificaciones-dropdown">
          <div className="notificaciones-header">
            <h3 className="notificaciones-title">Notificaciones</h3>
            {noLeidas > 0 && (
              <div className="notificaciones-actions">
                <button 
                  className="notificaciones-action-btn"
                  onClick={marcarTodasLeidas}
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>

          <div className="notificaciones-list">
            {loading ? (
              <div className="notificaciones-empty">Cargando...</div>
            ) : notificaciones.length === 0 ? (
              <div className="notificaciones-empty">
                No tienes notificaciones
              </div>
            ) : (
              notificaciones.map(notif => (
                <div 
                  key={notif._id} 
                  className={`notificacion-item ${notif.leida ? 'leida' : ''}`}
                  onClick={() => marcarComoLeida(notif._id)}
                >
                  <div className="notificacion-icon">
                    {(notif.tipo === 'like' || notif.tipo === 'like_review' || notif.tipo === 'like_comment') && '❤️'}
                    {notif.tipo === 'comentario' && '💬'}
                    {notif.tipo === 'seguidor' && '👥'}
                  </div>
                  <div className="notificacion-content">
                    <p className="notificacion-text">{notif.contenido}</p>
                    <span className="notificacion-time">
                      {new Date(notif.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  {!notif.leida && <div className="notificacion-unread" />}
                </div>
              ))
            )}
          </div>

          {notificaciones.length > 0 && (
            <div className="notificaciones-footer">
              <Link to="/notificaciones" className="ver-todas-btn">
                Ver todas las notificaciones
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesNav; 