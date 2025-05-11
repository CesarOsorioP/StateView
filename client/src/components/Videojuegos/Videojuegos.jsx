// src/components/Videojuegos.jsx
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

  // Función para generar ID único para una plataforma
  const getPlataformaId = (plataforma) => {
    return `plataforma-${plataforma}`;
  };

  useEffect(() => {
    const fetchVideojuegos = async () => {
      try {
        const response = await api.get("/api/videojuegos");
        const videojuegosData = response.data;
        setVideojuegos(videojuegosData);
        
        // Extraer plataformas únicas
        const plataformasMap = new Map();
        
        videojuegosData.forEach(videojuego => {
          // Comprobar si el videojuego tiene plataformas
          if (videojuego.plataformas) {
            // Si plataformas es un array
            if (Array.isArray(videojuego.plataformas)) {
              videojuego.plataformas.forEach(plataforma => {
                if (plataforma) {
                  const plataformaId = getPlataformaId(plataforma);
                  
                  if (!plataformasMap.has(plataformaId)) {
                    plataformasMap.set(plataformaId, {
                      id: plataformaId,
                      nombre: plataforma
                    });
                  }
                }
              });
            } 
            // Si plataformas es un string (posiblemente separado por comas)
            else if (typeof videojuego.plataformas === 'string') {
              const plataformasList = videojuego.plataformas.split(',').map(p => p.trim());
              
              plataformasList.forEach(plataforma => {
                if (plataforma) {
                  const plataformaId = getPlataformaId(plataforma);
                  
                  if (!plataformasMap.has(plataformaId)) {
                    plataformasMap.set(plataformaId, {
                      id: plataformaId,
                      nombre: plataforma
                    });
                  }
                }
              });
            }
            // Si plataformas es un objeto con un campo 'nombre'
            else if (typeof videojuego.plataformas === 'object' && videojuego.plataformas.nombre) {
              const plataforma = videojuego.plataformas.nombre;
              const plataformaId = getPlataformaId(plataforma);
              
              if (!plataformasMap.has(plataformaId)) {
                plataformasMap.set(plataformaId, {
                  id: plataformaId,
                  nombre: plataforma
                });
              }
            }
          }
        });
        
        const uniquePlataformas = Array.from(plataformasMap.values());
        
        setPlataformas(uniquePlataformas);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videojuegos:", error);
        setLoading(false);
      }
    };

    fetchVideojuegos();
  }, []);

  // Función para extraer el año de la fecha de lanzamiento
  const extractYear = (dateString) => {
    if (!dateString) return null;
    
    // Intentamos extraer el año de diferentes formatos comunes
    // Formato 1: dd/mm/aaaa o dd-mm-aaaa
    const formatoConSeparadores = /(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/;
    // Formato 2: aaaa/mm/dd o aaaa-mm-dd
    const formatoISOFecha = /(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/;
    // Formato 3: texto como "15 de Mayo de 2020"
    const formatoTexto = /(\d{4})$/;
    
    let year = null;
    
    if (formatoConSeparadores.test(dateString)) {
      const matches = dateString.match(formatoConSeparadores);
      year = matches[3]; // El año está en la tercera posición capturada
    } else if (formatoISOFecha.test(dateString)) {
      const matches = dateString.match(formatoISOFecha);
      year = matches[1]; // El año está en la primera posición capturada
    } else if (formatoTexto.test(dateString)) {
      const matches = dateString.match(formatoTexto);
      year = matches[1]; // Extraer el año si aparece al final del string
    } else if (dateString.length === 4 && !isNaN(dateString)) {
      // Si es solo un año (4 dígitos)
      year = dateString;
    }
    
    return year;
  };

  // Extrae los años únicos a partir de los videojuegos obtenidos
  const years = ["all", ...new Set(videojuegos.map(videojuego => 
    extractYear(videojuego.fecha_lanzamiento)
  ).filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b)))];

  // Encuentra el año mínimo y máximo para el selector de rango
  const allYears = videojuegos
    .map(videojuego => extractYear(videojuego.fecha_lanzamiento) ? parseInt(extractYear(videojuego.fecha_lanzamiento)) : null)
    .filter(Boolean);
  
  const minYear = allYears.length > 0 ? Math.min(...allYears) : 1970; // Los videojuegos empezaron a popularizarse en los 70
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();

  // Función para verificar si un videojuego tiene una plataforma específica
  const hasPlataforma = (videojuego, plataformaId) => {
    if (!videojuego.plataformas) return false;
    
    // Si plataformas es un array
    if (Array.isArray(videojuego.plataformas)) {
      return videojuego.plataformas.some(p => getPlataformaId(p) === plataformaId);
    } 
    // Si plataformas es un string (posiblemente separado por comas)
    else if (typeof videojuego.plataformas === 'string') {
      const plataformasList = videojuego.plataformas.split(',').map(p => p.trim());
      return plataformasList.some(p => getPlataformaId(p) === plataformaId);
    }
    // Si plataformas es un objeto con un campo 'nombre'
    else if (typeof videojuego.plataformas === 'object' && videojuego.plataformas.nombre) {
      return getPlataformaId(videojuego.plataformas.nombre) === plataformaId;
    }
    
    return false;
  };

  // Aplica todos los filtros
  const filteredVideojuegos = videojuegos.filter(videojuego => {
    // Extraer año del videojuego
    const gameYear = extractYear(videojuego.fecha_lanzamiento);
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
      if (!hasPlataforma(videojuego, filters.plataforma)) {
        return false;
      }
    }
    
    return true;
  });

  // Ordena por año: ascendente (más antiguo) o descendente (más reciente)
  const sortedVideojuegos = [...filteredVideojuegos].sort((a, b) => {
    const yearA = extractYear(a.fecha_lanzamiento) ? parseInt(extractYear(a.fecha_lanzamiento)) : 0;
    const yearB = extractYear(b.fecha_lanzamiento) ? parseInt(extractYear(b.fecha_lanzamiento)) : 0;
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
      // Si se selecciona un año específico, limpia el rango de años
      if (name === "year" && value !== "all") {
        setFilters(prev => ({
          ...prev,
          [name]: value,
          yearRange: { from: "", to: "" }
        }));
      } else {
        // Asegúrate de que el cambio de filtro se aplica correctamente
        setFilters(prev => {
          const newFilters = {
            ...prev,
            [name]: value
          };
          return newFilters;
        });
      }
    }
  };

  // Formatear géneros para mostrar (si está disponible)
  const formatGeneros = (generos) => {
    if (!generos) return "";
    
    if (Array.isArray(generos)) {
      return generos.join(", ");
    } else if (typeof generos === 'string') {
      return generos;
    } else if (typeof generos === 'object') {
      // Si es un objeto, intentar extraer nombres
      const generosArray = Object.values(generos)
        .filter(g => g && (typeof g === 'string' || (typeof g === 'object' && g.nombre)))
        .map(g => typeof g === 'string' ? g : g.nombre);
      
      return generosArray.join(", ");
    }
    
    return "";
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
              <label>Rango de años</label>
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
                .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente
                .map(plataforma => (
                  <option 
                    key={plataforma.id || `plataforma-${plataforma.nombre}`} 
                    value={plataforma.id || ''}
                  >
                    {plataforma.nombre || 'Plataforma desconocida'}
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
              <div key={videojuego.videojuego_id || `game-${videojuego.titulo}`} className="content-card">
                <Link to={`/videojuegos/${videojuego.videojuego_id}`} className="content-link">
                  <div className="poster-container">
                    <img src={videojuego.imagen || videojuego.portada} alt={videojuego.titulo || videojuego.nombre} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{videojuego.titulo || videojuego.nombre}</h3>
                    <p className="content-year">{extractYear(videojuego.fecha_lanzamiento)}</p>
                    <p className="content-artist">{formatGeneros(videojuego.generos)}</p>
                  </div>
                </Link>
                <div className="content-actions">
                  <Link 
                    to={`/videojuegos/${videojuego.videojuego_id}/reviews`} 
                    className="action-button" 
                    title="Reseñar videojuego"
                  >
                    <i className="far fa-star"></i>
                  </Link>
                </div>
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