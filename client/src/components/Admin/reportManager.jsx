import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import './reportManager.css';

const ReportManager = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pendiente');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/reportes?estado=${filter}`);
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Error al obtener reportes:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, newStatus) => {
    try {
      await api.put(`/api/reportes/${reportId}`, {
        estado: newStatus,
        mod_id: user._id
      });
      
      fetchReports();
      setShowModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      alert('Error al actualizar el estado del reporte');
    }
  };

  const handlePenalizeUser = async (userId) => {
    if (window.confirm('¿Estás seguro que deseas restringir a este usuario?')) {
        try {
            await api.put(`/api/persona/${userId}/estado`, { estado: 'Restringido' });
            alert('Usuario restringido exitosamente');
            setShowModal(false);
        } catch (error) {
            console.error('Error al restringir usuario:', error);
            alert('Error al restringir usuario');
        }
    }
  };

  const handleBanUser = async (userId) => {
    if (window.confirm('¿Estás seguro que deseas desactivar permanentemente a este usuario?')) {
        try {
            await api.put(`/api/persona/${userId}/estado`, { estado: 'Desactivado' });
            alert('Usuario desactivado exitosamente');
            setShowModal(false);
        } catch (error) {
            console.error('Error al desactivar usuario:', error);
            alert('Error al desactivar usuario');
        }
    }
  };

  const openReportDetails = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  if (!user || (user.rol !== 'Moderador' && user.rol !== 'Administrador' && user.rol !== 'Superadministrador')) {
    return (
      <div className="report-manager-page">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para ver esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-manager-page">
      <div className="page-header">
        <h1>Gestión de Reportes</h1>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'Pendiente' ? 'active' : ''}`}
            onClick={() => setFilter('Pendiente')}
          >
            Pendientes
          </button>
          <button 
            className={`filter-btn ${filter === 'Resuelto' ? 'active' : ''}`}
            onClick={() => setFilter('Resuelto')}
          >
            Resueltos
          </button>
          <button 
            className={`filter-btn ${filter === 'Rechazado' ? 'active' : ''}`}
            onClick={() => setFilter('Rechazado')}
          >
            Rechazados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.length === 0 ? (
            <div className="no-reports">
              <p>No hay reportes en estado "{filter}"</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="report-card">
                <div className="report-header">
                  <span className={`status-badge ${report.estado.toLowerCase()}`}>
                    {report.estado}
                  </span>
                  <span className="report-date">
                    {new Date(report.fecha).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="report-body">
                  <h3>Reportado por: {report.reporter?.nombre || 'Usuario anónimo'}</h3>
                  <p><strong>Usuario reportado:</strong> {report.reportedUser?.nombre || 'Desconocido'}</p>
                  <p><strong>Motivo:</strong> {report.motivo}</p>
                  {report.tipoContenido && (
                    <p><strong>Tipo:</strong> {report.tipoContenido}</p>
                  )}
                </div>

                <div className="report-actions">
                  <button 
                    className="btn-details"
                    onClick={() => openReportDetails(report)}
                  >
                    Ver Detalles
                  </button>
                  {report.estado === 'Pendiente' && (
                    <>
                      <button 
                        className="btn-resolve"
                        onClick={() => handleReportAction(report._id, 'Resuelto')}
                      >
                        Resolver
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleReportAction(report._id, 'Rechazado')}
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Reporte</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Información General</h3>
                <p><strong>Estado:</strong> <span className={`status-badge ${selectedReport.estado.toLowerCase()}`}>{selectedReport.estado}</span></p>
                <p><strong>Fecha:</strong> {new Date(selectedReport.fecha).toLocaleString()}</p>
                <p><strong>Reportado por:</strong> {selectedReport.reporter?.nombre || 'Desconocido'}</p>
                <p><strong>Email del reportador:</strong> {selectedReport.reporter?.email || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Usuario Reportado</h3>
                <p><strong>Nombre:</strong> {selectedReport.reportedUser?.nombre || 'Desconocido'}</p>
                <p><strong>Email:</strong> {selectedReport.reportedUser?.email || 'N/A'}</p>
                {selectedReport.reportedUser && (
                    <div className="user-actions">
                        <button 
                            className="btn-restrict"
                            onClick={() => handlePenalizeUser(selectedReport.reportedUser._id)}
                        >
                            Restringir Usuario
                        </button>
                        <button 
                            className="btn-ban"
                            onClick={() => handleBanUser(selectedReport.reportedUser._id)}
                        >
                            Desactivar Usuario
                        </button>
                    </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Motivo del Reporte</h3>
                <p>{selectedReport.motivo}</p>
              </div>

              {selectedReport.contenidoReportado && (
                <div className="detail-section">
                  <h3>Contenido Reportado</h3>
                  <p><strong>Tipo:</strong> {selectedReport.tipoContenido}</p>
                  <div className="content-preview">
                    {selectedReport.contenidoReportado}
                  </div>
                </div>
              )}

              {selectedReport.mod_id && (
                <div className="detail-section">
                  <h3>Moderador</h3>
                  <p>ID del moderador: {selectedReport.mod_id}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedReport.estado === 'Pendiente' && (
                <>
                  <button 
                    className="btn-resolve"
                    onClick={() => handleReportAction(selectedReport._id, 'Resuelto')}
                  >
                    Marcar como Resuelto
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleReportAction(selectedReport._id, 'Rechazado')}
                  >
                    Rechazar Reporte
                  </button>
                </>
              )}
              <button className="btn-close" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManager;
