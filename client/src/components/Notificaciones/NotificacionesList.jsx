import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import NotificacionItem from './NotificacionItem';
import './NotificacionesList.css';

const NotificacionesList = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notificaciones');
      setNotificaciones(response.data.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las notificaciones');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/api/notificaciones/${id}/leer`);
      setNotificaciones(prevNotificaciones =>
        prevNotificaciones.map(notif =>
          notif._id === id ? { ...notif, leida: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/api/notificaciones/leer-todas');
      setNotificaciones(prevNotificaciones =>
        prevNotificaciones.map(notif => ({ ...notif, leida: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  if (loading) {
    return (
      <div className="notificaciones-container">
        <div className="notificaciones-loading">
          Cargando notificaciones...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notificaciones-container">
        <div className="notificaciones-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="notificaciones-container">
      <div className="notificaciones-header">
        <h2>Notificaciones</h2>
        {notificaciones.some(n => !n.leida) && (
          <button 
            className="marcar-todas-btn"
            onClick={marcarTodasLeidas}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>
      
      {notificaciones.length === 0 ? (
        <div className="notificaciones-empty">
          No tienes notificaciones
        </div>
      ) : (
        <div className="notificaciones-list">
          {notificaciones.map(notificacion => (
            <NotificacionItem
              key={notificacion._id}
              notificacion={notificacion}
              onMarkAsRead={marcarComoLeida}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesList; 