import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './userManagement.css';
import api from '../../api/api';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('');
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contraseña: '',
    rol: 'Usuario',
    imagenPerfil: '',
    estado: 'Activo'
  });
  
  // Opciones para filtrado
  const estadosPermitidos = ['Activo', 'Restringido', 'Advertido', 'Desactivado'];
  const rolesPermitidos = ['Usuario', 'Moderador', 'Administrador'];
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterState, setFilterState] = useState('Todos');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  
  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/api/persona/');
        setUsers(res.data.data);
        setFilteredUsers(res.data.data);
        setError('');
      } catch (error) {
        setError('Error al cargar los usuarios. Por favor, intenta de nuevo.');
        showToastMessage('Error al cargar los usuarios', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Aplicar filtros y búsqueda cuando cambien los criterios
  useEffect(() => {
    let result = [...users];
    
    // Aplicar filtro por búsqueda
    if (searchTerm) {
      result = result.filter(user => 
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar filtro por rol
    if (filterRole !== 'Todos') {
      result = result.filter(user => user.rol === filterRole);
    }
    
    // Aplicar filtro por estado
    if (filterState !== 'Todos') {
      result = result.filter(user => user.estado === filterState);
    }
    
    // Aplicar ordenamiento
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredUsers(result);
    // Resetear a la primera página cuando cambian los filtros
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterState, sortConfig]);

  // Calcular usuarios para la página actual
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  
  // Calcular total de páginas
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

  // Función para enviar el formulario (crear o actualizar usuario)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedUser) {
        // Actualizar usuario
        const res = await api.put(`/api/persona/${selectedUser}`, formData);
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === selectedUser ? res.data.data : u))
        );
        showToastMessage('Usuario actualizado con éxito', 'success');
      } else {
        // Crear nuevo usuario
        const res = await api.post('/api/persona', formData);
        setUsers((prev) => [...prev, res.data.data]);
        showToastMessage('Usuario creado con éxito', 'success');
      }
      closeModal();
    } catch (error) {
      const errorMsg = selectedUser 
        ? 'Error actualizando el usuario. Por favor, intenta de nuevo.' 
        : 'Error creando el usuario. Por favor, intenta de nuevo.';
      setError(errorMsg);
      showToastMessage(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del usuario a editar
  const handleEdit = (userId) => {
    const userToEdit = users.find((u) => u._id === userId);
    if (userToEdit) {
      setSelectedUser(userId);
      setFormData({
        nombre: userToEdit.nombre,
        email: userToEdit.email,
        contraseña: '', // No mostrar contraseña actual
        rol: userToEdit.rol,
        imagenPerfil: userToEdit.imagenPerfil || '',
        estado: userToEdit.estado || 'Activo'
      });
      setIsModalOpen(true);
    }
  };

  // Función para cambiar el estado de un usuario
  const handleChangeEstado = (userId, nuevoEstado) => {
    const userToChange = users.find((u) => u._id === userId);
    
    setSelectedUser(userId);
    setConfirmAction(() => async () => {
      setLoading(true);
      try {
        const res = await api.put(`/api/persona/${userId}/estado`, { estado: nuevoEstado });
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === userId ? {...u, estado: nuevoEstado} : u))
        );
        showToastMessage(`Estado de ${userToChange.nombre} actualizado a ${nuevoEstado}`, 'success');
      } catch (error) {
        setError('Error al actualizar el estado. Por favor, intenta de nuevo.');
        showToastMessage('Error al actualizar el estado', 'error');
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
    setSelectedUser(null);
    setFormData({
      nombre: '',
      email: '',
      contraseña: '',
      rol: 'Usuario',
      imagenPerfil: '',
      estado: 'Activo'
    });
  };

  // Abrir modal para crear nuevo usuario
  const openCreateModal = () => {
    resetForm();
    setSelectedUser(null);
    setIsModalOpen(true);
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

  // Si todavía no tenemos el usuario cargado, podemos mostrar un mensaje "Cargando..."
  if (!user) {
    return (
      <div className="user-management-page">
        <div className="loading-container">
          <div className="spinner-container">
            <div className="loading-spinner"></div>
          </div>
          <p>Cargando información de usuario...</p>
        </div>
      </div>
    );
  }

  // Verificar que el usuario tenga permisos (Administrador o Moderador)
  if (user.rol !== 'Administrador' && user.rol !== 'Moderador') {
    return (
      <div className="user-management-page">
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
    <div className="user-management-page">
      {/* Encabezado de la página */}
      <div className="page-header">
        <div className="header-title">
          <h1>Gestión de Usuarios</h1>
          <p className="header-subtitle">Administra los usuarios de la plataforma</p>
        </div>
        <button 
          className="create-button" 
          onClick={openCreateModal}
        >
          <span className="button-icon">+</span>
          <span>Crear Usuario</span>
        </button>
      </div>
      
      {/* Panel de filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">&#128269;</span>
        </div>
        
        <div className="filters-container">
          <div className="filter-group">
            <label>Rol:</label>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="Todos">Todos</option>
              {rolesPermitidos.map(rol => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </div>
          
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
          
          {(filterRole !== 'Todos' || filterState !== 'Todos' || searchTerm) && (
            <button 
              className="clear-filters-button"
              onClick={() => {
                setFilterRole('Todos');
                setFilterState('Todos');
                setSearchTerm('');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      
      {/* Mensajes de estado */}
      {error && <div className="status-message error-message">{error}</div>}
      {success && <div className="status-message success-message">{success}</div>}
      
      {/* Contenido principal */}
      <div className="content-container">
        {loading && !users.length ? (
          <div className="loading-container">
            <div className="spinner-container">
              <div className="loading-spinner"></div>
            </div>
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <>
            <div className="table-stats">
              <span>
                Mostrando {Math.min(indexOfFirstUser + 1, filteredUsers.length)} - {Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuarios
              </span>
            </div>
            
            <div className="table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th 
                      className={getSortClass('nombre')}
                      onClick={() => requestSort('nombre')}
                    >
                      Nombre
                    </th>
                    <th 
                      className={getSortClass('email')}
                      onClick={() => requestSort('email')}
                    >
                      Email
                    </th>
                    <th 
                      className={getSortClass('rol')}
                      onClick={() => requestSort('rol')}
                    >
                      Rol
                    </th>
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
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="no-results">
                          <p>No se encontraron usuarios con los filtros seleccionados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((u) => (
                      <tr key={u._id} className={`user-row estado-${u.estado.toLowerCase()}`}>
                        <td className="user-name-cell">
                          <div className="user-avatar">
                            {u.imagenPerfil ? (
                              <img src={u.imagenPerfil} alt={u.nombre} />
                            ) : (
                              <div className="default-avatar">{u.nombre.charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <span>{u.nombre}</span>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge role-${u.rol.toLowerCase()}`}>
                            {u.rol}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${u.estado.toLowerCase()}`}>
                            {u.estado}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-button edit" 
                              onClick={() => handleEdit(u._id)}
                              title="Editar usuario"
                            >
                              <span className="action-icon">✏️</span>
                            </button>
                            
                            <div className="dropdown">
                              <button className="action-button change-state">
                                <span className="action-icon">⚙️</span>
                              </button>
                              <div className="dropdown-content">
                                <div className="dropdown-header">Cambiar estado</div>
                                {estadosPermitidos.map(estado => (
                                  u.estado !== estado && (
                                    <button 
                                      key={estado}
                                      className={`dropdown-item status-${estado.toLowerCase()}`}
                                      onClick={() => handleChangeEstado(u._id, estado)}
                                    >
                                      {estado}
                                    </button>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Controles de paginación */}
            {filteredUsers.length > 0 && (
              <div className="pagination-container">
                <button 
                  className="pagination-button"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  &laquo; Anterior
                </button>
                
                <div className="pagination-numbers">
                  {getPageNumbers().map((pageNumber, index) => (
                    pageNumber === '...' ? (
                      <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                    ) : (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                      >
                        {pageNumber}
                      </button>
                    )
                  ))}
                </div>
                
                <button 
                  className="pagination-button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Siguiente &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para crear/editar usuario */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <div className="modal-header">
              <h2>{selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
              <button 
                className="close-modal-button" 
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Ingrese el nombre completo"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              
              <div className="form-group password-group">
                <label htmlFor="contraseña">
                  Contraseña:
                  {selectedUser && (
                    <span className="optional-label">(Opcional para actualizar)</span>
                  )}
                </label>
                <input
                  id="contraseña"
                  type="password"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleInputChange}
                  placeholder={selectedUser ? 'Deja vacío para no cambiar' : 'Ingresar contraseña segura'}
                  required={!selectedUser}
                  className="form-input"
                />
                <small className="input-help">
                  {selectedUser ? 
                    "Dejar en blanco para mantener la contraseña actual" : 
                    "La contraseña debe tener al menos 8 caracteres"
                  }
                </small>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rol">Rol:</label>
                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="Usuario">Usuario</option>
                    <option value="Moderador">Moderador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="estado">Estado:</label>
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
              </div>
              
              <div className="form-group">
                <label htmlFor="imagenPerfil">Imagen de Perfil:</label>
                <input
                  id="imagenPerfil"
                  type="text"
                  name="imagenPerfil"
                  value={formData.imagenPerfil}
                  onChange={handleInputChange}
                  placeholder="URL de la imagen de perfil (opcional)"
                  className="form-input"
                />
                <small className="input-help">
                  Proporciona una URL válida para la imagen de perfil
                </small>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="form-button primary" disabled={loading}>
                  {loading ? (
                    <><span className="button-spinner"></span>Procesando...</>
                  ) : selectedUser ? (
                    'Actualizar Usuario'
                  ) : (
                    'Crear Usuario'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="form-button secondary"
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-header">
              <h3>Confirmar acción</h3>
            </div>
            <div className="confirm-content">
              <p>¿Estás seguro de que deseas cambiar el estado de este usuario?</p>
              <p>Esta acción puede afectar los permisos del usuario en la plataforma.</p>
            </div>
            <div className="confirm-buttons">
              <button 
                className="confirm-button cancel" 
                onClick={closeConfirmModal}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button confirm" 
                onClick={confirmAction}
                disabled={loading}
              >
                {loading ? (
                  <><span className="button-spinner"></span>Procesando...</>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {showToast && (
        <div className={`toast-notification ${toastType}`}>
          <div className="toast-icon">
            {toastType === 'success' ? '✓' : '✕'}
          </div>
          <div className="toast-message">{toastMessage}</div>
          <button 
            className="toast-close" 
            onClick={() => setShowToast(false)}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;