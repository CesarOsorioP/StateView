import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Series.css";
import api from '../../api/api';

const Series = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    genre: "all",
    sort: "asc"
  });
  const [genres, setGenres] = useState(["all"]);
  const [years, setYears] = useState(["all"]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await api.get("/api/serie");
        setSeries(response.data);
        
        // Extraer años y géneros únicos
        const uniqueYears = ["all", ...new Set(response.data.map(serie => {
          return serie.fechaInicio && serie.fechaInicio.substring(0, 4);
        }).filter(Boolean).sort())];
        
        const uniqueGenres = ["all", ...new Set(response.data.flatMap(serie => 
          serie.genero ? serie.genero.split(", ") : []
        ).sort())];
        
        setYears(uniqueYears);
        setGenres(uniqueGenres);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const filteredSeries = series.filter(serie => {
    // Filtro por año
    if (filters.year !== "all") {
      const serieYear = serie.fechaInicio && serie.fechaInicio.substring(0, 4);
      if (serieYear !== filters.year) return false;
    }
    
    // Filtro por género
    if (filters.genre !== "all") {
      const serieGenres = serie.genero ? serie.genero.split(", ") : [];
      if (!serieGenres.includes(filters.genre)) return false;
    }
    
    return true;
  });

  const sortedSeries = [...filteredSeries].sort((a, b) => {
    if (filters.sort === "alphabetical") {
      const titleA = (a.titulo || '').toLowerCase();
      const titleB = (b.titulo || '').toLowerCase();
      return titleA.localeCompare(titleB, 'es');
    }
    
    const yearA = a.fechaInicio ? parseInt(a.fechaInicio.substring(0, 4)) : 0;
    const yearB = b.fechaInicio ? parseInt(b.fechaInicio.substring(0, 4)) : 0;
    
    if (yearA === yearB) {
      const hasEndedA = a.fechaFinal && a.fechaFinal.trim() !== '';
      const hasEndedB = b.fechaFinal && b.fechaFinal.trim() !== '';
      
      if (hasEndedA !== hasEndedB) {
        return filters.sort === "asc" ? (hasEndedA ? -1 : 1) : (hasEndedA ? 1 : -1);
      }
      
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

  const getSerieStatus = (serie) => {
    if (serie.fechaFinal && serie.fechaFinal.trim() !== '') {
      return `${serie.fechaInicio} - ${serie.fechaFinal}`;
    }
    return `${serie.fechaInicio} - Presente`;
  };

  return (
    <div className="series-content-page">
      <div className="series-content-header">
        <h1>Series</h1>
        <p>Explora y descubre las mejores series de televisión y streaming</p>
      </div>

      <div className="series-filters-container compact-filters">
        <div className="series-filter-group">
          <label>Año</label>
          <select 
            name="year" 
            value={filters.year} 
            onChange={handleFilterChange}
            className="series-filter-select"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year === "all" ? "Todos los años" : year}
              </option>
            ))}
          </select>
        </div>

        <div className="series-filter-group">
          <label>Género</label>
          <select 
            name="genre" 
            value={filters.genre} 
            onChange={handleFilterChange}
            className="series-filter-select"
          >
            {genres.map(genre => (
              <option key={genre} value={genre}>
                {genre === "all" ? "Todos los géneros" : genre}
              </option>
            ))}
          </select>
        </div>

        <div className="series-filter-group">
          <label>Ordenar por</label>
          <select 
            name="sort" 
            value={filters.sort} 
            onChange={handleFilterChange}
            className="series-filter-select"
          >
            <option value="asc">Más antiguas</option>
            <option value="desc">Más recientes</option>
            <option value="alphabetical">A - Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="series-loading-container">
          <div className="series-loading-spinner"></div>
          <p>Cargando series...</p>
        </div>
      ) : (
        <>
          <div className="series-content-count">
            Mostrando {sortedSeries.length} series
          </div>

          <div className="series-pagination-bar">
            {Array.from({ length: Math.ceil(sortedSeries.length / itemsPerPage) }, (_, i) => (
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
            <div className="series-pagination-jump">
              <span>Ir a:</span>
              <input
                type="number"
                min="1"
                max={Math.ceil(sortedSeries.length / itemsPerPage)}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= Math.ceil(sortedSeries.length / itemsPerPage)) {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= Math.ceil(sortedSeries.length / itemsPerPage)) {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                className="series-pagination-input"
              />
              <span>de {Math.ceil(sortedSeries.length / itemsPerPage)}</span>
            </div>
          </div>

          <div className="series-content-grid compact-grid">
            {sortedSeries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(serie => (
              <div key={serie.serie_id || serie._id} className="series-content-card">
                <Link to={`/serie/${serie.serie_id || serie._id}`} className="series-content-link">
                  <div className="series-poster-container">
                    <img src={serie.poster} alt={serie.titulo} className="series-poster" />
                  </div>
                  <div className="series-content-info">
                    <h3 className="series-content-title">{serie.titulo}</h3>
                    <p className="series-content-year">{serie.fechaInicio ? serie.fechaInicio.substring(0, 4) : ''}</p>
                    <p className="series-content-artist">{serie.genero}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {sortedSeries.length === 0 && (
            <div className="series-no-results">
              <h3>No se encontraron series con los filtros seleccionados</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}

          {/* Paginación al final */}
          {sortedSeries.length > 0 && (
            <div className="series-pagination-bar">
              {Array.from({ length: Math.ceil(sortedSeries.length / itemsPerPage) }, (_, i) => (
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
              <div className="series-pagination-jump">
                <span>Ir a:</span>
                <input
                  type="number"
                  min="1"
                  max={Math.ceil(sortedSeries.length / itemsPerPage)}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= Math.ceil(sortedSeries.length / itemsPerPage)) {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= Math.ceil(sortedSeries.length / itemsPerPage)) {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }
                  }}
                  className="series-pagination-input"
                />
                <span>de {Math.ceil(sortedSeries.length / itemsPerPage)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Series;