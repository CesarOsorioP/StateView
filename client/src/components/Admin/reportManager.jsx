import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './reportManager.css';
import api from '../../api/api';

const ReportManager = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'descending' });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    estado: 'Pendiente',
    observaciones: ''
  });
  // Estado para almacenar los detalles del elemento reportado
  const [reportedItem, setReportedItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  
  // Opciones para filtrado
  const estadosPermitidos = ['Pendiente', 'Resuelto', 'Rechazado'];
  
  // Filtros
  const [filterState, setFilterState] = useState('Todos');
  const [filterPeriod, setFilterPeriod] = useState('Todos');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(10);
  
  // Cargar reportes
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/api/reportes/');
        // Asegurarse de que res.data.data existe y es un array
        const reportData = Array.isArray(res.data.data) ? res.data.data : 
                           Array.isArray(res.data) ? res.data : [];
        setReports(reportData);
        setFilteredReports(reportData);
        setError('');
      } catch (error) {
        console.error('Error al cargar reportes:', error);
        setError('Error al cargar los reportes. Por favor, intenta de nuevo.');
        showToastMessage('Error al cargar los reportes', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Verificar si el usuario actual puede gestionar reportes
  const canManageReports = () => {
    if (!user) return false;
    return ['Superadministrador', 'Administrador', 'Moderador'].includes(user.rol);
  };

  // Aplicar filtros y búsqueda cuando cambien los criterios
  useEffect(() => {
    if (!Array.isArray(reports)) {
      setFilteredReports([]);
      return;
    }
    
    let result = [...reports];
    
    // Aplicar filtro por búsqueda
    if (searchTerm) {
      result = result.filter(report => 
        (report.motivo && report.motivo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.reporter && report.reporter.nombre && report.reporter.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (report.reportedUser && report.reportedUser.nombre && report.reportedUser.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Aplicar filtro por estado
    if (filterState !== 'Todos') {
      result = result.filter(report => report.estado === filterState);
    }
    
    // Aplicar filtro por período
    if (filterPeriod !== 'Todos') {
      const now = new Date();
      let dateFilter = new Date();
      
      switch (filterPeriod) {
        case 'Hoy':
          dateFilter.setDate(now.getDate() - 1);
          break;
        case 'Esta semana':
          dateFilter.setDate(now.getDate() - 7);
          break;
        case 'Este mes':
          dateFilter.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      result = result.filter(report => new Date(report.fecha) >= dateFilter);
    }
    
    // Aplicar ordenamiento
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Manejar casos especiales como objetos anidados
        let valA, valB;
        
        if (sortConfig.key === 'reporter') {
          valA = a.reporter?.nombre || '';
          valB = b.reporter?.nombre || '';
        } else if (sortConfig.key === 'reportedUser') {
          valA = a.reportedUser?.nombre || '';
          valB = b.reportedUser?.nombre || '';
        } else {
          valA = a[sortConfig.key] || '';
          valB = b[sortConfig.key] || '';
        }
        
        // Si son fechas, convertirlas a objetos Date para comparación
        if (sortConfig.key === 'fecha') {
          valA = new Date(valA);
          valB = new Date(valB);
        }
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredReports(result);
    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1);
  }, [reports, searchTerm, filterState, filterPeriod, sortConfig]);

  // Calcular reportes para la página actual
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  
  // Calcular total de páginas
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  // Funciones para la paginación
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generar array de números de página para la navegación
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Si hay pocas páginas, mostrar todas
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Si hay muchas páginas, mostrar un rango alrededor de la página actual
    
    // Siempre incluir la primera página
    pageNumbers.push(1);
    
    // Determinar el inicio y final del rango de páginas a mostrar
    let rangeStart = Math.max(2, currentPage - 1);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    // Añadir ellipsis después de la página 1 si es necesario
    if (rangeStart > 2) {
      pageNumbers.push('...');
    }
    
    // Añadir páginas en el rango
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pageNumbers.push(i);
    }
    
    // Añadir ellipsis antes de la última página si es necesario
    if (rangeEnd < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Siempre incluir la última página si hay más de una página
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Cerrar modal con clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para enviar el formulario (actualizar reporte)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar los datos para enviar
      const dataToSubmit = { 
        estado: formData.estado,
        mod_id: user._id // Identificar al moderador que procesa el reporte
      };

      // Actualizar reporte
      const res = await api.put(`/api/reportes/${selectedReport}`, dataToSubmit);
      // Manejar diferentes estructuras de respuesta
      const updatedReport = res.data.data || res.data;
      
      // Actualizar el estado local
      setReports((prevReports) =>
        prevReports.map((r) => (r._id === selectedReport ? updatedReport : r))
      );
      
      setSuccess(`Reporte actualizado a estado ${formData.estado}`);
      showToastMessage(`Reporte actualizado a estado ${formData.estado}`, 'success');
      
      closeModal();
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      const errorMsg = 'Error actualizando el reporte. Por favor, intenta de nuevo.';
      setError(errorMsg);
      showToastMessage(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función mejorada para cargar el elemento reportado (reseña o comentario)
  const fetchReportedItem = async (reportId) => {
    setLoadingItem(true);
    try {
      // Usar el endpoint que obtiene el elemento reportado
      const res = await api.get(`/api/reportes/${reportId}/item`);
      if (res.data && res.data.data) {
        setReportedItem(res.data.data);
      } else {
        setReportedItem(null);
      }
    } catch (error) {
      console.error('Error al cargar el elemento reportado:', error);
      setReportedItem(null);
    } finally {
      setLoadingItem(false);
    }
  };

  // Abrir modal para gestionar un reporte
  const handleManageReport = async (reportId) => {
    const reportToManage = reports.find((r) => r._id === reportId);
    if (reportToManage) {
      setSelectedReport(reportId);
      setFormData({
        estado: reportToManage.estado || 'Pendiente',
        observaciones: '' // Campo para notas adicionales (si se requiere implementar)
      });
      
      // Obtener el elemento reportado si el reporte tiene referencia a una reseña o comentario
      if (reportToManage.review || reportToManage.comment) {
        await fetchReportedItem(reportId);
      } else {
        setReportedItem(null);
      }
      
      setIsModalOpen(true);
    }
  };

  // Función para cambiar el estado de un reporte
  const handleChangeStatus = (reportId, nuevoEstado) => {
    setSelectedReport(reportId);
    setConfirmAction(() => async () => {
      setLoading(true);
      try {
        const res = await api.put(`/api/reportes/${reportId}`, { 
          estado: nuevoEstado,
          mod_id: user._id 
        });
        
        setReports((prevReports) =>
          prevReports.map((r) => (r._id === reportId ? {...r, estado: nuevoEstado} : r))
        );
        
        setSuccess(`Estado del reporte actualizado a ${nuevoEstado}`);
        showToastMessage(`Reporte actualizado a ${nuevoEstado}`, 'success');
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        setError('Error al actualizar el estado. Por favor, intenta de nuevo.');
        showToastMessage('Error al actualizar el estado', 'error');
      } finally {
        setLoading(false);
        setIsConfirmModalOpen(false);
      }
    });
    
    setIsConfirmModalOpen(true);
  };

  // Función para actualizar el estado de un usuario reportado 
  const handleRestrictUser = (userId, userName, newStatus) => {
    setConfirmAction(() => async () => {
      setLoading(true);
      try {
        // Actualizar estado del usuario reportado
        await api.put(`/api/persona/${userId}`, { estado: newStatus });
        
        showToastMessage(`Usuario ${userName} ha sido ${newStatus.toLowerCase()}`, 'success');
      } catch (error) {
        console.error('Error al restringir usuario:', error);
        showToastMessage(`Error al actualizar estado del usuario ${userName}`, 'error');
      } finally {
        setLoading(false);
        setIsConfirmModalOpen(false);
      }
    });
    
    setIsConfirmModalOpen(true);
  };

  // Mostrar mensaje toast
  const showToastMessage = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    // Auto cerrar después de 3 segundos
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Función para ordenar la tabla
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Obtener clase para el encabezado de la columna ordenada
  const getSortClass = (name) => {
    if (!sortConfig.key) {
      return '';
    }
    return sortConfig.key === name ? `sort-${sortConfig.direction}` : '';
  };

  // Reiniciar formulario
  const resetForm = () => {
    setSelectedReport(null);
    setFormData({
      estado: 'Pendiente',
      observaciones: ''
    });
    setReportedItem(null);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Cerrar modal de confirmación
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Determinar el tipo de contenido para mostrar (Película, Serie, etc.)
  const getContentType = (onModel) => {
    switch(onModel) {
      case 'Pelicula': return 'Película';
      case 'Serie': return 'Serie';
      case 'Videojuego': return 'Videojuego';
      case 'Album': return 'Álbum';
      default: return 'Contenido';
    }
  };

  // Renderizar estrellas para el rating
  const renderRatingStars = (rating) => {
    const stars = [];
    const maxRating = 5; // Asumiendo un rating de 5 estrellas máximo
    
    for (let i = 1; i <= maxRating; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    
    return (
      <div className="rating-stars">
        {stars} <span className="rating-value">({rating}/5)</span>
      </div>
    );
  };

  // Si todavía no tenemos el usuario cargado, podemos mostrar un mensaje "Cargando..."
  if (loading && !user) {
    return (
      <div className="report-management-page">
        <div className="loading-container">
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
          <p>Cargando información de usuario...</p>
        </div>
      </div>
    );
  }

  // Verificar que el usuario tenga permisos
  if (user && !['Superadministrador', 'Administrador', 'Moderador'].includes(user.rol)) {
    return (
      <div className="report-management-page">
        <div className="access-denied">
          <div className="access-denied-icon">&#128274;</div>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para ver esta sección. Esta área está restringida a Administradores y Moderadores.</p>
          <button className="back-button" onClick={() => window.history.back()}>
            Volver a la página anterior
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="report-management-page">
    {/* Toast notification */}
    {showToast && (
      <div className={`toast-notification ${toastType}`}>
        <div className="toast-message">{toastMessage}</div>
        <button className="toast-close" onClick={() => setShowToast(false)}>×</button>
      </div>
    )}

    <div className="reports-header">
      <h1>Gestión de Reportes</h1>
      <p>Administra y procesa los reportes enviados por los usuarios.</p>
    </div>

    {/* Filters and controls section */}
    <div className="filters-section">
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por motivo o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filters-container">
        <div className="filter-group">
          <label>Estado:</label>
          <select 
            value={filterState} 
            onChange={(e) => setFilterState(e.target.value)}
            className="filter-select"
          >
            <option value="Todos">Todos</option>
            {estadosPermitidos.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Período:</label>
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="filter-select"
          >
            <option value="Todos">Todos</option>
            <option value="Hoy">Hoy</option>
            <option value="Esta semana">Esta semana</option>
            <option value="Este mes">Este mes</option>
          </select>
        </div>
      </div>
    </div>

    {/* Status messages */}
    {error && <div className="error-message">{error}</div>}
    {success && <div className="success-message">{success}</div>}

    {/* Reports table */}
    {loading ? (
      <div className="loading-container">
        <div className="spinner-container">
          <div className="loading-spinner"></div>
        </div>
        <p>Cargando reportes...</p>
      </div>
    ) : filteredReports.length === 0 ? (
      <div className="no-reports">
        <div className="no-data-icon">📋</div>
        <p>No se encontraron reportes con los filtros seleccionados.</p>
      </div>
    ) : (
      <>
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th 
                  className={getSortClass('fecha')} 
                  onClick={() => requestSort('fecha')}
                >
                  Fecha
                </th>
                <th 
                  className={getSortClass('reporter')} 
                  onClick={() => requestSort('reporter')}
                >
                  Reportado por
                </th>
                <th 
                  className={getSortClass('reportedUser')} 
                  onClick={() => requestSort('reportedUser')}
                >
                  Usuario Reportado
                </th>
                <th 
                  className={getSortClass('motivo')} 
                  onClick={() => requestSort('motivo')}
                >
                  Motivo
                </th>
                <th>Contenido Reportado</th>
                <th 
                  className={getSortClass('estado')} 
                  onClick={() => requestSort('estado')}
                >
                  Estado
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report) => (
                <tr key={report._id}>
                  <td className="date-cell">{formatDate(report.fecha)}</td>
                  <td>{report.reporter?.nombre || 'Usuario desconocido'}</td>
                  <td>{report.reportedUser?.nombre || 'Usuario desconocido'}</td>
                  <td className="motivo-cell">
                    <div className="motivo-content">
                      {report.motivo}
                      {report.review && (
                        <span className="report-badge">
                          {report.reportedContent?.tipo === 'Comentario' 
                            ? 'Comentario' 
                            : `Reseña de ${getContentType(report.reportedContent?.onModel)}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="reported-content-cell">
                    {report.contenidoReportado ? (
                      <div className="reported-content-preview">
                        <div className="content-type">
                          {report.tipoContenido === 'Comentario' 
                            ? 'Comentario' 
                            : `Reseña de ${getContentType(report.reportedContent?.onModel)}`}
                        </div>
                        <div className="content-text">
                          {report.contenidoReportado}
                        </div>
                        {report.reportedContent?.puntuacion && (
                          <div className="content-rating">
                            {renderRatingStars(report.reportedContent.puntuacion)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="no-content">No hay contenido específico</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${report.estado.toLowerCase()}`}>
                      {report.estado}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-button4 view-button"
                      onClick={() => handleManageReport(report._id)}
                      title="Ver detalles"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    {report.estado === 'Pendiente' && (
                      <>
                        <button 
                          className="action-button4 approve-button"
                          onClick={() => handleChangeStatus(report._id, 'Resuelto')}
                          title="Marcar como resuelto"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button 
                          className="action-button4 reject-button"
                          onClick={() => handleChangeStatus(report._id, 'Rechazado')}
                          title="Rechazar reporte"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                    
                    {report.reportedUser && report.reportedUser._id && (
                      <div className="dropdown">
                        <button className="action-button4 user-action-button">
                          <i className="fas fa-user-cog"></i>
                        </button>
                        <div className="dropdown-content">
                          <button onClick={() => handleRestrictUser(report.reportedUser._id, report.reportedUser.nombre, 'Suspendido')}>
                            Suspender usuario
                          </button>
                          <button onClick={() => handleRestrictUser(report.reportedUser._id, report.reportedUser.nombre, 'Bloqueado')}>
                            Bloquear usuario
                          </button>
                          <button onClick={() => handleRestrictUser(report.reportedUser._id, report.reportedUser.nombre, 'Activo')}>
                            Activar usuario
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="pagination">
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1}
            className="pagination-button"
          >
            <i className="fas fa-chevron-left"></i> Anterior
          </button>
          
          <div className="page-numbers">
            {getPageNumbers().map((number, index) => (
              <button
                key={index}
                onClick={() => typeof number === 'number' ? paginate(number) : null}
                className={`page-number ${currentPage === number ? 'active' : ''} ${typeof number !== 'number' ? 'ellipsis' : ''}`}
                disabled={typeof number !== 'number'}
              >
                {number}
              </button>
            ))}
          </div>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Siguiente <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </>
    )}

    {/* Modal para gestionar un reporte */}
    {isModalOpen && (
      <div className="modal-backdrop">
        <div className="modal-container" ref={modalRef}>
          <div className="modal-header">
            <h2>Gestionar Reporte</h2>
            <button className="close-button" onClick={closeModal}>×</button>
          </div>
          
          <div className="modal-body">
            {/* Detalles del reporte */}
            {selectedReport && reports && (
              <div className="report-details">
                <div className="detail-group">
                  <h3>Detalles del reporte</h3>
                  
                  <div className="detail-item">
                    <span className="detail-label">Fecha:</span>
                    <span>{formatDate(reports.find(r => r._id === selectedReport)?.fecha)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Reportado por:</span>
                    <span>{reports.find(r => r._id === selectedReport)?.reporter?.nombre || 'Usuario desconocido'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Usuario reportado:</span>
                    <span>{reports.find(r => r._id === selectedReport)?.reportedUser?.nombre || 'Usuario desconocido'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Motivo:</span>
                    <span className="report-motivo">{reports.find(r => r._id === selectedReport)?.motivo}</span>
                  </div>
                </div>
                
                {/* Contenido reportado */}
                {loadingItem ? (
                  <div className="loading-item">Cargando contenido reportado...</div>
                ) : reportedItem ? (
                  <div className="reported-content">
                    <h3>Contenido reportado</h3>
                    
                    {reportedItem.tipo === 'Reseña' ? (
                      <div className="review-content">
                        <div className="review-header">
                          <div className="review-title">
                            <span className="content-type-badge">
                              {getContentType(reportedItem.onModel)}
                            </span>
                            <span className="content-title">
                              {reportedItem.contenido?.titulo || 'Título no disponible'}
                            </span>
                          </div>
                          {renderRatingStars(reportedItem.puntuacion)}
                        </div>
                        <div className="review-text">{reportedItem.texto}</div>
                      </div>
                    ) : reportedItem.tipo === 'Comentario' ? (
                      <div className="comment-content">
                        <div className="comment-text">{reportedItem.texto}</div>
                      </div>
                    ) : (
                      <div className="unknown-content">
                        <p>Contenido reportado no disponible o eliminado.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-content">
                    <p>No hay contenido específico reportado o no está disponible.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Formulario para actualizar estado */}
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label htmlFor="estado">Actualizar estado:</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {estadosPermitidos.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Actualizando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    
    {/* Modal de confirmación */}
    {isConfirmModalOpen && (
      <div className="modal-backdrop">
        <div className="confirm-modal">
          <div className="confirm-modal-header">
            <h3>Confirmar acción</h3>
            <button className="close-button" onClick={closeConfirmModal}>×</button>
          </div>
          
          <div className="confirm-modal-body">
            <p>¿Estás seguro de que deseas realizar esta acción?</p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
          
          <div className="confirm-modal-footer">
            <button 
              className="cancel-button"
              onClick={closeConfirmModal}
            >
              Cancelar
            </button>
            <button 
              className="confirm-button"
              onClick={confirmAction}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default ReportManager;