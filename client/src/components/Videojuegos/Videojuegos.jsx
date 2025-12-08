import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from '../../api/api';
import './Videojuegos.css';

const Videojuegos = () => {
  const [videojuegos, setVideojuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plataformas, setPlataformas] = useState([]);
  const [filters, setFilters] = useState({
    year: "all",
    yearRange: {
      from: "",
      to: ""
    },
    plataforma: "all",
    sort: "asc" // "asc" = de más antiguos a más recientes, "desc" = lo inverso
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  useEffect(() => {
    const fetchVideojuegos = async () => {
      try {
        const response = await api.get("/api/videojuego");
        const videojuegosData = response.data;
        setVideojuegos(videojuegosData);
        
        // Extraer plataformas únicas
        const plataformasUnicas = new Set();
        
        videojuegosData.forEach(videojuego => {
          if (videojuego.plataformas) {
            // Asumiendo que plataformas puede ser un string con múltiples plataformas separadas por comas
            const plataformasList = videojuego.plataformas.split(',').map(p => p.trim());
            plataformasList.forEach(plataforma => {
              if (plataforma) {
                plataformasUnicas.add(plataforma);
              }
            });
          }
        });
        
        const plataformasArray = Array.from(plataformasUnicas).map(nombre => ({
          id: nombre,
          nombre: nombre
        }));
        
        setPlataformas(plataformasArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videojuegos:", error);
        setLoading(false);
      }
    };

    fetchVideojuegos();
  }, []);

  // Extrae los años únicos para el selector de año individual
  const years = ["all", ...new Set(videojuegos.map(videojuego => {
    let year = videojuego.fecha_lanzamiento;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  // Encuentra el año mínimo y máximo para el selector de rango
  const allYears = videojuegos
    .map(videojuego => videojuego.fecha_lanzamiento ? parseInt(videojuego.fecha_lanzamiento.substring(0, 4)) : null)
    .filter(Boolean);
  
  const minYear = allYears.length > 0 ? Math.min(...allYears) : 1900;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();

  // Aplica todos los filtros
  const filteredVideojuegos = videojuegos.filter(videojuego => {
    // Extraer año del videojuego
    let gameYear = videojuego.fecha_lanzamiento;
    if (gameYear && gameYear.length > 4) {
      gameYear = gameYear.substring(0, 4);
    }
    const yearNum = gameYear ? parseInt(gameYear) : 0;
    
    // Filtro por año específico
    if (filters.year !== "all" && gameYear !== filters.year) {
      return false;
    }
    
    // Filtro por rango de años
    if (filters.year === "all" && 
        ((filters.yearRange.from && yearNum < parseInt(filters.yearRange.from)) || 
         (filters.yearRange.to && yearNum > parseInt(filters.yearRange.to)))) {
      return false;
    }
    
    // Filtro por plataforma
    if (filters.plataforma !== "all") {
      if (!videojuego.plataformas) {
        return false;
      }
      
      const plataformasList = videojuego.plataformas.split(',').map(p => p.trim());
      if (!plataformasList.includes(filters.plataforma)) {
        return false;
      }
    }
    
    return true;
  });

  // Ordena por año o alfabéticamente
  const sortedVideojuegos = [...filteredVideojuegos].sort((a, b) => {
    if (filters.sort === "alphabetical") {
      const titleA = (a.titulo || '').toLowerCase();
      const titleB = (b.titulo || '').toLowerCase();
      return titleA.localeCompare(titleB, 'es');
    }
    let yearA = a.fecha_lanzamiento ? parseInt(a.fecha_lanzamiento.substring(0, 4)) : 0;
    let yearB = b.fecha_lanzamiento ? parseInt(b.fecha_lanzamiento.substring(0, 4)) : 0;
    return filters.sort === "asc" ? yearA - yearB : yearB - yearA;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "from" || name === "to") {
      setFilters(prev => ({
        ...prev,
        yearRange: {
          ...prev.yearRange,
          [name]: value
        }
      }));
    } else {
      if (name === "year" && value !== "all") {
        setFilters(prev => ({
          ...prev,
          [name]: value,
          yearRange: { from: "", to: "" }
        }));
      } else {
        setFilters(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  return (
    <div className="game-content-page">
      <div className="game-content-header">
        <h1>Videojuegos</h1>
        <p>Explora y descubre los mejores videojuegos de todos los tiempos</p>
      </div>

      <div className="game-filters-bar-horizontal">
        <select 
          name="year" 
          value={filters.year} 
          onChange={handleFilterChange}
          className="game-filter-select"
        >
          {years.map(year => (
            <option key={year || 'unknown'} value={year || ''}>
              {year === "all" ? "Todos los años" : (year || 'Año desconocido')}
            </option>
          ))}
        </select>
        {filters.year === "all" && (
          <>
            <input
              type="number"
              name="from"
              placeholder="Desde"
              min={minYear}
              max={maxYear}
              value={filters.yearRange.from}
              onChange={handleFilterChange}
              className="game-filter-input"
            />
            <span>-</span>
            <input
              type="number"
              name="to"
              placeholder="Hasta"
              min={minYear}
              max={maxYear}
              value={filters.yearRange.to}
              onChange={handleFilterChange}
              className="game-filter-input"
            />
          </>
        )}
        <select 
          name="plataforma" 
          value={filters.plataforma} 
          onChange={handleFilterChange}
          className="game-filter-select"
        >
          <option value="all">Todas las plataformas</option>
          {plataformas
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(plataforma => (
              <option 
                key={plataforma.id} 
                value={plataforma.id}
              >
                {plataforma.nombre}
              </option>
          ))}
        </select>
        <select 
          name="sort" 
          value={filters.sort} 
          onChange={handleFilterChange}
          className="game-filter-select"
        >
          <option value="asc">Más antiguos</option>
          <option value="desc">Más recientes</option>
          <option value="alphabetical">A - Z</option>
        </select>
        <button 
          className="game-clear-filters-btn"
          onClick={() => setFilters({
            year: "all",
            yearRange: { from: "", to: "" },
            plataforma: "all",
            sort: "asc"
          })}
        >
          Limpiar
        </button>
      </div>

      {loading ? (
        <div className="game-loading-container">
          <div className="game-loading-spinner"></div>
          <p>Cargando videojuegos...</p>
        </div>
      ) : (
        <>
          <div className="game-content-count">
            Mostrando {sortedVideojuegos.length} videojuegos
          </div>

          <div className="game-pagination-bar">
            {Array.from({ length: Math.ceil(sortedVideojuegos.length / itemsPerPage) }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {i + 1}
              </button>
            ))}
            <div className="game-pagination-jump">
              <span>Ir a:</span>
              <input
                type="number"
                min="1"
                max={Math.ceil(sortedVideojuegos.length / itemsPerPage)}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= Math.ceil(sortedVideojuegos.length / itemsPerPage)) {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= Math.ceil(sortedVideojuegos.length / itemsPerPage)) {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                className="game-pagination-input"
              />
              <span>de {Math.ceil(sortedVideojuegos.length / itemsPerPage)}</span>
            </div>
          </div>

          <div className="game-content-grid compact-grid ultra-compact-grid">
            {sortedVideojuegos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(videojuego => (
              <div key={videojuego.videojuego_id || videojuego._id} className="game-content-card">
                <Link to={`/videojuego/${videojuego.juego_id}`} className="game-content-link">
                  <div className="game-poster-container">
                    <img src={videojuego.imagen} alt={videojuego.titulo} className="game-poster" />
                  </div>
                  <div className="game-content-info">
                    <h3 className="game-content-title">{videojuego.titulo}</h3>
                    <p className="game-content-year">{videojuego.fecha_lanzamiento ? videojuego.fecha_lanzamiento.substring(0, 4) : ''}</p>
                    <p className="game-content-artist">{videojuego.plataformas}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {sortedVideojuegos.length === 0 && (
            <div className="game-no-results">
              <h3>No se encontraron videojuegos con los filtros seleccionados</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}

          {/* Paginación al final */}
          {sortedVideojuegos.length > 0 && (
            <div className="game-pagination-bar">
              {Array.from({ length: Math.ceil(sortedVideojuegos.length / itemsPerPage) }, (_, i) => (
                <button
                  key={i + 1}
                  className={currentPage === i + 1 ? 'active' : ''}
                  onClick={() => {
                    setCurrentPage(i + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <div className="game-pagination-jump">
                <span>Ir a:</span>
                <input
                  type="number"
                  min="1"
                  max={Math.ceil(sortedVideojuegos.length / itemsPerPage)}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= Math.ceil(sortedVideojuegos.length / itemsPerPage)) {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= Math.ceil(sortedVideojuegos.length / itemsPerPage)) {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }
                  }}
                  className="game-pagination-input"
                />
                <span>de {Math.ceil(sortedVideojuegos.length / itemsPerPage)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Videojuegos;