import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from '../../api/api';

const Peliculas = () => {
  const [peliculas, setPeliculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [directores, setDirectores] = useState([]);
  const [filters, setFilters] = useState({
    year: "all",
    yearRange: {
      from: "",
      to: ""
    },
    director: "all",
    sort: "asc" // "asc" = de más antiguas a más recientes, "desc" = lo inverso
  });

  // Función para generar ID único para un director
  const getDirectorId = (director) => {
    return `director-${director}`;
  };

  useEffect(() => {
    const fetchPeliculas = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/api/peliculas");
        const peliculasData = response.data || [];
        
        // Validar que los datos sean un array
        if (!Array.isArray(peliculasData)) {
          throw new Error('Formato de datos inválido');
        }

        setPeliculas(peliculasData);
        
        // Extraer directores únicos
        const directoresMap = new Map();
        
        peliculasData.forEach(pelicula => {
          if (pelicula && pelicula.director) {
            const directorId = getDirectorId(pelicula.director);
            
            if (!directoresMap.has(directorId)) {
              directoresMap.set(directorId, {
                id: directorId,
                nombre: pelicula.director
              });
            }
          }
        });
        
        const uniqueDirectores = Array.from(directoresMap.values());
        setDirectores(uniqueDirectores);
      } catch (error) {
        console.error("Error fetching peliculas:", error);
        setError('Error al cargar las películas. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPeliculas();
  }, []);

  // Función para extraer el año de la fecha de estreno
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

  // Extrae los años únicos a partir de las películas obtenidas
  const years = ["all", ...new Set(peliculas.map(pelicula => 
    extractYear(pelicula.fecha_estreno)
  ).filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b)))];

  // Encuentra el año mínimo y máximo para el selector de rango
  const allYears = peliculas
    .map(pelicula => extractYear(pelicula.fecha_estreno) ? parseInt(extractYear(pelicula.fecha_estreno)) : null)
    .filter(Boolean);
  
  const minYear = allYears.length > 0 ? Math.min(...allYears) : 1900;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();

  // Aplica todos los filtros
  const filteredPeliculas = peliculas.filter(pelicula => {
    // Extraer año de la película
    const movieYear = extractYear(pelicula.fecha_estreno);
    const yearNum = movieYear ? parseInt(movieYear) : 0;
    
    // Filtro por año específico
    if (filters.year !== "all" && movieYear !== filters.year) {
      return false;
    }
    
    // Filtro por rango de años
    if (filters.year === "all" && 
        ((filters.yearRange.from && yearNum < parseInt(filters.yearRange.from)) || 
         (filters.yearRange.to && yearNum > parseInt(filters.yearRange.to)))) {
      return false;
    }
    
    // Filtro por director
    if (filters.director !== "all") {
      // Verificar si la película tiene información de director
      if (!pelicula.director) {
        return false;
      }
      
      // Usar la misma función para generar el ID del director
      const peliculaDirectorId = getDirectorId(pelicula.director);
      
      // Comparar con el ID del filtro seleccionado
      if (peliculaDirectorId !== filters.director) {
        return false;
      }
    }
    
    return true;
  });

  // Ordena por año: ascendente (más antiguo) o descendente (más reciente)
  const sortedPeliculas = [...filteredPeliculas].sort((a, b) => {
    const yearA = extractYear(a.fecha_estreno) ? parseInt(extractYear(a.fecha_estreno)) : 0;
    const yearB = extractYear(b.fecha_estreno) ? parseInt(extractYear(b.fecha_estreno)) : 0;
    return filters.sort === "asc" ? yearA - yearB : yearB - yearA;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Changing filter ${name} to:`, value); // Para depuración
    
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
          console.log("Nuevos filtros:", newFilters); // Para depuración
          return newFilters;
        });
      }
    }
  };

  // Formatear duración de la película (si está disponible)
  const formatDuracion = (duracion) => {
    if (!duracion) return "";
    
    // Si es un número, asumir que son minutos
    if (!isNaN(duracion)) {
      return `${duracion} min`;
    }
    
    return duracion;
  };

  return (
    <div className="content-page">
      <div className="content-header">
        <h1>Películas</h1>
        <p>Explora y descubre las mejores películas de todos los tiempos</p>
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
            <label>Director</label>
            <select 
              name="director" 
              value={filters.director} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">Todos los directores</option>
              {directores
                .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente
                .map(director => (
                  <option 
                    key={director.id || `director-${director.nombre}`} 
                    value={director.id || ''}
                  >
                    {director.nombre || 'Director desconocido'}
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
              <option value="asc">Más antiguas</option>
              <option value="desc">Más recientes</option>
            </select>
          </div>
          
          <button 
            className="reset-filters-btn"
            onClick={() => setFilters({
              year: "all",
              yearRange: { from: "", to: "" },
              director: "all",
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
          <p>Cargando películas...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedPeliculas.length} películas
          </div>

          <div className="content-grid">
            {sortedPeliculas.map(pelicula => {
              // Validar que la película tenga los datos necesarios
              if (!pelicula || !pelicula.pelicula_id) {
                return null;
              }

              return (
                <div key={pelicula.pelicula_id} className="content-card">
                  <Link to={`/peliculas/${pelicula.pelicula_id}`} className="content-link">
                    <div className="poster-container">
                      <img 
                        src={pelicula.imagen} 
                        alt={pelicula.titulo || 'Película sin título'} 
                        className="poster" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg'; // Imagen por defecto
                        }}
                      />
                    </div>
                    <div className="content-info">
                      <h3 className="content-title">{pelicula.titulo || 'Sin título'}</h3>
                      <p className="content-year">
                        {extractYear(pelicula.fecha_estreno)} 
                        {formatDuracion(pelicula.duracion) && `• ${formatDuracion(pelicula.duracion)}`}
                      </p>
                      <p className="content-artist">{pelicula.director || 'Director desconocido'}</p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {sortedPeliculas.length === 0 && (
            <div className="no-results">
              <h3>No se encontraron películas con los filtros seleccionados</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Peliculas;