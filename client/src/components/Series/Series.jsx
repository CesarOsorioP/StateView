import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Series.css";

const Series = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc"
  });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/series");
        setSeries(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching series:", error);
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const years = ["all", ...new Set(series.map(serie => {
    let year = serie.fecha_estreno;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  const filteredSeries = series.filter(serie => {
    if (filters.year !== "all") {
      let serieYear = serie.fecha_estreno;
      if (serieYear && serieYear.length > 4) {
        serieYear = serieYear.substring(0, 4);
      }
      return serieYear === filters.year;
    }
    return true;
  });

  const sortedSeries = [...filteredSeries].sort((a, b) => {
    return filters.sort === "asc" 
      ? a.titulo.localeCompare(b.titulo)
      : b.titulo.localeCompare(a.titulo);
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="content-page series-theme">
      <div className="content-header">
        <h1>Series</h1>
        <p>Descubre las mejores series de televisión</p>
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
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
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
                    <img src={serie.portada} alt={serie.titulo} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{serie.titulo}</h3>
                    <p className="content-year">{serie.fecha_estreno}</p>
                    <p className="content-creator">{serie.creador}</p>
                    <p className="season-info">{serie.temporadas} temporadas</p>
                  </div>
                </Link>
                <div className="content-actions">
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
              <h3>No se encontraron series</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Series;