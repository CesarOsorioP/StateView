// src/components/Series.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Series.css";
import "./api/api.js"

const Series = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc" // "asc" = de más antiguos a más recientes, "desc" = lo inverso
  });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await axios.get("/api/series");
        setSeries(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching series:", error);
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  // Extrae los años únicos a partir de las series obtenidas
  // Ahora usando fecha_inicio en lugar de fecha_estreno
  const years = ["all", ...new Set(series.map(serie => {
    let year = serie.fechaInicio;
    if (year && year.length >= 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean).sort())];

  // Aplica el filtro de año
  const filteredSeries = series.filter(serie => {
    if (filters.year !== "all") {
      let serieYear = serie.fechaInicio;
      if (serieYear && serieYear.length >= 4) {
        serieYear = serieYear.substring(0, 4);
      }
      return serieYear === filters.year;
    }
    return true;
  });

  // Ordena por año: ascendente (más antiguo) o descendente (más reciente)
  const sortedSeries = [...filteredSeries].sort((a, b) => {
    let yearA = a.fechaInicio ? parseInt(a.fechaInicio.substring(0, 4)) : 0;
    let yearB = b.fechaInicio ? parseInt(b.fechaInicio.substring(0, 4)) : 0;
    
    // Si los años son iguales, verifica si alguna serie ha finalizado
    if (yearA === yearB) {
      const hasEndedA = a.fechaFinal && a.fechaFinal.trim() !== '';
      const hasEndedB = b.fechaFinal && b.fechaFinal.trim() !== '';
      
      // Si solo una ha finalizado, ordénalas (series finalizadas van primero en orden ascendente)
      if (hasEndedA !== hasEndedB) {
        return filters.sort === "asc" ? (hasEndedA ? -1 : 1) : (hasEndedA ? 1 : -1);
      }
      
      // Si ambas finalizaron, compara por año de finalización
      if (hasEndedA && hasEndedB) {
        const endYearA = parseInt(a.fechaFinal.substring(0, 4));
        const endYearB = parseInt(b.fechaFinal.substring(0, 4));
        return filters.sort === "asc" ? endYearA - endYearB : endYearB - endYearA;
      }
    }
    
    return filters.sort === "asc" ? yearA - yearB : yearB - yearA;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para mostrar el estado de la serie (En emisión o finalizada)
  const getSerieStatus = (serie) => {
    if (serie.fechaFinal && serie.fechaFinal.trim() !== '') {
      return `${serie.fechaInicio} - ${serie.fechaFinal}`;
    }
    return `${serie.fechaInicio} - Presente`;
  };

  return (
    <div className="content-page">
      <div className="content-header">
        <h1>Series</h1>
        <p>Explora y descubre las mejores series de televisión</p>
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
          <p>Cargando series...</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedSeries.length} series
          </div>

          <div className="content-grid">
            {sortedSeries.map(serie => (
              <div key={serie.serie_id} className="content-card">
                <Link to={`/series/${serie.serie_id}`} className="content-link">
                  <div className="poster-container">
                    <img src={serie.poster} alt={serie.titulo} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{serie.titulo}</h3>
                    <p className="content-year">{getSerieStatus(serie)}</p>
                    <p className="content-artist">{serie.genero}</p>
                  </div>
                </Link>
                <div className="content-actions">
                  {/* Enlace para ir a la página de reseñas para esta serie */}
                  <Link 
                    to={`/series/${serie.serie_id}/reviews`} 
                    className="action-button" 
                    title="Reseñar serie"
                  >
                    <i className="far fa-star"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {sortedSeries.length === 0 && (
            <div className="no-results">
              <h3>No se encontraron series con los filtros seleccionados</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Series;