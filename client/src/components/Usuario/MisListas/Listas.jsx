import React, { useState } from 'react';
import './Listas.css';

const Listas = () => {
  const [listas, setListas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [nombreLista, setNombreLista] = useState('');
  const [nombreEditado, setNombreEditado] = useState('');
  const [error, setError] = useState('');
  const [listaAEditar, setListaAEditar] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState('todas');

  // Definir las categorías disponibles
  const categorias = [
    { id: 'todas', nombre: 'Mis Listas', icono: '📋', color: '#5E9DFF' },
    { id: 'ver', nombre: 'Ver', icono: '👁️', color: '#00FF00' },
    { id: 'me-gusta', nombre: 'Me gusta', icono: '❤️', color: '#FF5555' },
    { id: 'vistas', nombre: 'Vistas', icono: '✓', color: '#4387FF' },
    { id: 'no-me-gustaron', nombre: 'No me gustaron', icono: '👎', color: '#FF8C00' },
    { id: 'por-ver', nombre: 'Por ver', icono: '🕒', color: '#9D4EDD' }
  ];

  const handleCrearLista = () => {
    if (!nombreLista.trim()) {
      setError('Por favor ingresa un nombre para la lista');
      return;
    }
    
    const nuevaLista = {
      id: Date.now(),
      nombre: nombreLista,
      fechaCreacion: new Date().toLocaleDateString(),
      items: [],
      categoria: categoriaActiva === 'todas' ? 'ver' : categoriaActiva // Asignar categoría por defecto
    };
    
    setListas([...listas, nuevaLista]);
    setNombreLista('');
    setShowModal(false);
    setError('');
  };

  const handleEditarLista = () => {
    if (!nombreEditado.trim()) {
      setError('Por favor ingresa un nombre para la lista');
      return;
    }
    
    setListas(listas.map(lista => 
      lista.id === listaAEditar.id 
        ? { ...lista, nombre: nombreEditado } 
        : lista
    ));
    setShowEditModal(false);
    setError('');
  };

  const handleEliminarLista = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta lista?')) {
      setListas(listas.filter(lista => lista.id !== id));
    }
  };

  const handleCambiarCategoria = (categoria) => {
    setCategoriaActiva(categoria);
  };

  const handleSeleccionarLista = (lista) => {
    console.log("Lista seleccionada:", lista);
  };

  const abrirModalEdicion = (lista) => {
    setListaAEditar(lista);
    setNombreEditado(lista.nombre);
    setShowEditModal(true);
  };

  // Filtrar listas según la categoría seleccionada
  const listasFiltradas = categoriaActiva === 'todas' 
    ? listas 
    : listas.filter(lista => lista.categoria === categoriaActiva);

  // Cambiar categoría de una lista
  const cambiarCategoriaLista = (listaId, nuevaCategoria) => {
    setListas(listas.map(lista => 
      lista.id === listaId 
        ? { ...lista, categoria: nuevaCategoria } 
        : lista
    ));
  };

  return (
    <div className="listas-page">
      <div className="page-header">
        <h1>Mis Listas</h1>
        <button 
          className="create-button" 
          onClick={() => setShowModal(true)}
        >
          Crear lista
        </button>
      </div>

      <div className="gradient-divider"></div>

      {/* Navegación de categorías */}
      <div className="categorias-nav">
        {categorias.map(categoria => (
          <div 
            key={categoria.id} 
            className={`categoria-item ${categoriaActiva === categoria.id ? 'activo' : ''}`}
            onClick={() => handleCambiarCategoria(categoria.id)}
            style={categoriaActiva === categoria.id ? {borderColor: categoria.color} : {}}
          >
            <span className="categoria-icon" style={{color: categoria.color}}>{categoria.icono}</span>
            <span className="categoria-text">{categoria.nombre}</span>
          </div>
        ))}
      </div>

      {listasFiltradas.length === 0 ? (
        <div className="empty-state">
          <h2>{categoriaActiva === 'todas' ? 'Aún no tienes ninguna lista' : `No tienes listas en la categoría "${categorias.find(c => c.id === categoriaActiva)?.nombre}"`}</h2>
          <p>¿Deseas crear una?</p>
          <button 
            className="create-button" 
            onClick={() => setShowModal(true)}
          >
            Crear lista
          </button>
        </div>
      ) : (
        <div className="listas-container">
          {listasFiltradas.map((lista) => (
            <div key={lista.id} className="lista-card">
              <div className="lista-info" onClick={() => handleSeleccionarLista(lista)}>
                <h3>{lista.nombre}</h3>
                <p>Creada el: {lista.fechaCreacion}</p>
                <p>{lista.items.length} elementos</p>
                <div className="lista-categoria-badge" style={{backgroundColor: categorias.find(c => c.id === lista.categoria)?.color}}>
                  {categorias.find(c => c.id === lista.categoria)?.nombre}
                </div>
              </div>
              <div className="lista-actions">
                <div className="lista-categoria-selector">
                  <span>Mover a: </span>
                  <select 
                    value={lista.categoria}
                    onChange={(e) => cambiarCategoriaLista(lista.id, e.target.value)}
                    className="categoria-select"
                  >
                    {categorias.slice(1).map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="action-buttons-container">
                  <button 
                    className="action-button edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalEdicion(lista);
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarLista(lista.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear lista */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Crear nueva lista</h2>
              <button 
                className="close-modal-button" 
                onClick={() => {
                  setShowModal(false);
                  setError('');
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="nombreLista">Nombre de la lista:</label>
                <input
                  id="nombreLista"
                  type="text"
                  value={nombreLista}
                  onChange={(e) => setNombreLista(e.target.value)}
                  placeholder="Ej: Mis películas favoritas"
                  className="form-input"
                />
                {error && <p className="error-message">{error}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="categoriaLista">Categoría:</label>
                <select
                  id="categoriaLista"
                  value={categoriaActiva === 'todas' ? 'ver' : categoriaActiva}
                  onChange={(e) => setCategoriaActiva(e.target.value)}
                  className="form-input"
                >
                  {categorias.slice(1).map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setError('');
                }} 
                className="form-button secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCrearLista}
                className="form-button primary"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar lista */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar lista</h2>
              <button 
                className="close-modal-button" 
                onClick={() => {
                  setShowEditModal(false);
                  setError('');
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="nombreEditado">Nuevo nombre:</label>
                <input
                  id="nombreEditado"
                  type="text"
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  placeholder="Nuevo nombre de la lista"
                  className="form-input"
                />
                {error && <p className="error-message">{error}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="categoriaEditada">Categoría:</label>
                <select
                  id="categoriaEditada"
                  value={listaAEditar?.categoria || 'ver'}
                  onChange={(e) => setListaAEditar({...listaAEditar, categoria: e.target.value})}
                  className="form-input"
                >
                  {categorias.slice(1).map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setError('');
                }} 
                className="form-button secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleEditarLista}
                className="form-button primary"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Listas;