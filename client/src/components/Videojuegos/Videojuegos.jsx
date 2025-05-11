import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from '../../api/api';

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

  useEffect(() => {
    const fetchVideojuegos = async () => {
      try {
        const response = await api.get("/api/videojuegos");
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

  // Ordena por año: ascendente (más antiguo) o descendente (más reciente)
  const sortedVideojuegos = [...filteredVideojuegos].sort((a, b) => {
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
    <div className="content-page">
      <div className="content-header">
        <h1>Videojuegos</h1>
        <p>Explora y descubre los mejores videojuegos de todos los tiempos</p>
      </div>

      <div className="filters-container">
        <div className="filter-section">
          <h3>Filtros</h3>
          
          <div className="filter-group">
            <label>Año</label>
            <select 
              name="year" 
              value={filters.year} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              {years.map(year => (
                <option key={year || 'unknown'} value={year || ''}>
                  {year === "all" ? "Todos los años" : (year || 'Año desconocido')}
                </option>
              ))}
            </select>
          </div>
          
          {filters.year === "all" && (
            <div className="filter-group-range">
              <div className="range-inputs">
                <input
                  type="number"
                  name="from"
                  placeholder="Desde"
                  min={minYear}
                  max={maxYear}
                  value={filters.yearRange.from}
                  onChange={handleFilterChange}
                  className="filter-input"
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
                  className="filter-input"
                />
              </div>
            </div>
          )}

          <div className="filter-group">
            <label>Plataforma</label>
            <select 
              name="plataforma" 
              value={filters.plataforma} 
              onChange={handleFilterChange}
              className="filter-select"
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
          </div>

          <div className="filter-group">
            <label>Ordenar por</label>
            <select 
              name="sort" 
              value={filters.sort} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="asc">Más antiguos</option>
              <option value="desc">Más recientes</option>
            </select>
          </div>
          
          <button 
            className="reset-filters-btn"
            onClick={() => setFilters({
              year: "all",
              yearRange: { from: "", to: "" },
              plataforma: "all",
              sort: "asc"
            })}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando videojuegos...</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedVideojuegos.length} videojuegos
          </div>

          <div className="content-grid">
            {sortedVideojuegos.map(videojuego => (
              <div key={videojuego.videojuego_id || videojuego.juego_id} className="content-card">
                <Link to={`/videojuegos/${videojuego.juego_id}`} className="content-link">
                  <div className="poster-container">
                    <img src={videojuego.imagen} alt={videojuego.titulo} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{videojuego.titulo}</h3>
                    <p className="content-year">{videojuego.fecha_lanzamiento}</p>
                    <p className="content-artist">{videojuego.desarrolladora}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {sortedVideojuegos.length === 0 && (
            <div className="no-results">
              <h3>No se encontraron videojuegos con los filtros seleccionados</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Videojuegos;