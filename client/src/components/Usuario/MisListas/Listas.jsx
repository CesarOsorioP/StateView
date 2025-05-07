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

  const handleCrearLista = () => {
    if (!nombreLista.trim()) {
      setError('Por favor ingresa un nombre para la lista');
      return;
    }
    
    const nuevaLista = {
      id: Date.now(),
      nombre: nombreLista,
      fechaCreacion: new Date().toLocaleDateString(),
      items: []
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

  const handleSeleccionarLista = (lista) => {
    console.log("Lista seleccionada:", lista);
  };

  const abrirModalEdicion = (lista) => {
    setListaAEditar(lista);
    setNombreEditado(lista.nombre);
    setShowEditModal(true);
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

      {listas.length === 0 ? (
        <div className="empty-state">
          <h2>Aún no tienes ninguna lista</h2>
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
          {listas.map((lista) => (
            <div key={lista.id} className="lista-card">
              <div className="lista-info" onClick={() => handleSeleccionarLista(lista)}>
                <h3>{lista.nombre}</h3>
                <p>Creada el: {lista.fechaCreacion}</p>
                <p>{lista.items.length} elementos</p>
              </div>
              <div className="lista-actions">
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