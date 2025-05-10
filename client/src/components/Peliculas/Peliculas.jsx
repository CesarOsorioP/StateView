// src/components/Peliculas.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import api from '../../api/api'

const Peliculas = () => {
  const [peliculas, setPeliculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc" // "asc" = de más antiguas a más recientes, "desc" = lo inverso
  });

  useEffect(() => {
    const fetchPeliculas = async () => {
      try {
        const response = await api.get("/api/peliculas");
        setPeliculas(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching peliculas:", error);
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

  // Aplica el filtro de año
  const filteredPeliculas = peliculas.filter(pelicula => {
    if (filters.year !== "all") {
      const movieYear = extractYear(pelicula.fecha_estreno);
      return movieYear === filters.year;
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
        <div className="filter-group">
          <label>Año</label>
          <select 
            name="year" 
            value={filters.year} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year === "all" ? "Todos los años" : year}
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
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando películas...</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedPeliculas.length} películas
          </div>

          <div className="content-grid">
            {sortedPeliculas.map(pelicula => (
              <div key={pelicula.pelicula_id} className="content-card">
                <Link to={`/peliculas/${pelicula.pelicula_id}`} className="content-link">
                  <div className="poster-container">
                    <img src={pelicula.imagen} alt={pelicula.titulo} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{pelicula.titulo}</h3>
                    <p className="content-year">{extractYear(pelicula.fecha_estreno)} {formatDuracion(pelicula.duracion) && `• ${formatDuracion(pelicula.duracion)}`}</p>
                    <p className="content-artist">{pelicula.director}</p>
                  </div>
                </Link>
                <div className="content-actions">
                  {/* Enlace para ir a la página de reseñas para esta película */}
                  <Link 
                    to={`/peliculas/${pelicula.pelicula_id}/reviews`} 
                    className="action-button" 
                    title="Reseñar película"
                  >
                    <i className="far fa-star"></i>
                  </Link>
                </div>
              </div>
            ))}
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