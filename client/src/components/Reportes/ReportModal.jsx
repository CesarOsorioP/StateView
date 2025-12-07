import React, { useState } from 'react';
import { FaFlag, FaTimes } from 'react-icons/fa';
import './ReportModal.css';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const ReportModal = ({ isOpen, onClose, reportedUserId, reviewId = null }) => {
  const { user } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!motivo.trim()) {
      setError('Debes especificar un motivo para el reporte');
      return;
    }

    setSending(true);
    setError('');

    try {
      await api.post('http://localhost:5000/api/reportes', {
        reporter: user.id || user._id,
        reportedUser: reportedUserId,
        review: reviewId,
        motivo: motivo
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess(true);
      setMotivo('');
      
      // Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error al enviar reporte:', err);
      setError(err.response?.data?.error || 'Error al enviar el reporte');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal">
        <div className="report-modal-header">
          <h3><FaFlag /> Reportar usuario</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {success ? (
          <div className="report-success">
            <p>¡Reporte enviado correctamente!</p>
            <p>Gracias por ayudarnos a mantener la comunidad segura.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="motivo">Motivo del reporte:</label>
              <textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica el motivo de tu reporte..."
                rows={5}
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancelar
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={sending || !motivo.trim()}
              >
                {sending ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;