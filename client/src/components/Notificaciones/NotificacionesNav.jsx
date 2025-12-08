import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import api from '../../api/api';
import './NotificacionesNav.css';

const NotificacionesNav = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const [pulse, setPulse] = useState(false);
  const prevNoLeidasRef = React.useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const getUnreadCount = (notifs = [], countResponse) => {
    if (typeof countResponse === 'number' && !Number.isNaN(countResponse)) {
      return countResponse;
    }
    const maybeCount = countResponse?.count ?? countResponse?.noLeidas ?? countResponse?.total;
    if (typeof maybeCount === 'number' && !Number.isNaN(maybeCount)) return maybeCount;
    if (Array.isArray(notifs)) return notifs.filter(n => !n.leida).length;
    return 0;
  };

  const fetchNotificaciones = async () => {
    try {
      const [notificacionesRes, noLeidasRes] = await Promise.all([
        api.get('/api/notificaciones'),
        api.get('/api/notificaciones/no-leidas')
      ]);
      console.log('notificacionesRes:', notificacionesRes);
      console.log('notificacionesRes.data:', notificacionesRes.data);
      console.log('noLeidasRes.data:', noLeidasRes.data);

      const notifsArray = Array.isArray(notificacionesRes.data?.data)
        ? notificacionesRes.data.data
        : Array.isArray(notificacionesRes.data)
          ? notificacionesRes.data
          : [];

      if (!Array.isArray(notifsArray)) {
        console.error('API response for notifications is not an array:', notificacionesRes.data?.data);
      }

      setNotificaciones(notifsArray || []);

      const newCount = getUnreadCount(notifsArray, noLeidasRes.data);
      // Marcar si hay nuevas no leídas
      const prevCount = prevNoLeidasRef.current;
      setNoLeidas(newCount);
      setHasNew(newCount > 0);
      if (newCount > prevCount) {
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
      }
      prevNoLeidasRef.current = newCount;
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
      setNoLeidas(prev => {
        const next = Math.max(0, prev - 1);
        prevNoLeidasRef.current = next;
        setHasNew(next > 0);
        return next;
      });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/api/notificaciones/leer-todas');
      setNotificaciones(notificaciones.map(notif => ({ ...notif, leida: true })));
      setNoLeidas(0);
      prevNoLeidasRef.current = 0;
      setHasNew(false);
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
    }
  };

  const eliminarTodasNotificaciones = async () => {
    try {
      await api.delete('/api/notificaciones/todas');
      setNotificaciones([]);
      setNoLeidas(0);
      prevNoLeidasRef.current = 0;
      setHasNew(false);
    } catch (error) {
      console.error('Error al eliminar todas las notificaciones:', error);
    }
  };

  return (
    <div className="notificaciones-nav">
      <div 
        className={`notificaciones-icon ${hasNew ? 'has-new' : ''} ${pulse ? 'has-new-pulse' : ''}`} 
        onClick={handleClick}
      >
        <FaBell />
        {noLeidas > 0 && <span className="notificaciones-dot" />}
        {noLeidas > 0 && (
          <span className="notificaciones-badge">{noLeidas}</span>
        )}
      </div>

      {isOpen && (
        <div className="notificaciones-dropdown">
          <div className="notificaciones-header">
            <h3 className="notificaciones-title">Notificaciones</h3>
            <div className="notificaciones-actions">
              {noLeidas > 0 && (
                <button 
                  className="notificaciones-action-btn"
                  onClick={marcarTodasLeidas}
                  title="Marcar todas como leídas"
                >
                  <i className="fas fa-check-double"></i> Leídas
                </button>
              )}
              {notificaciones.length > 0 && (
                <button 
                  className="notificaciones-action-btn delete"
                  onClick={eliminarTodasNotificaciones}
                  title="Eliminar todas"
                >
                  <i className="fas fa-trash-alt"></i> Limpiar
                </button>
              )}
            </div>
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