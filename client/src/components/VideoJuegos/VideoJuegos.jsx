import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./VideoJuegos.css";

const Videojuegos = () => {
  const [videojuegos, setVideojuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc"
  });

  useEffect(() => {
    const fetchVideojuegos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videojuegos");
        setVideojuegos(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching games:", error);
        setLoading(false);
      }
    };

    fetchVideojuegos();
  }, []);

  const years = ["all", ...new Set(videojuegos.map(juego => {
    let year = juego.fecha_lanzamiento;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  const filteredVideojuegos = videojuegos.filter(juego => {
    if (filters.year !== "all") {
      let juegoYear = juego.fecha_lanzamiento;
      if (juegoYear && juegoYear.length > 4) {
        juegoYear = juegoYear.substring(0, 4);
      }
      return juegoYear === filters.year;
    }
    return true;
  });

  const sortedVideojuegos = [...filteredVideojuegos].sort((a, b) => {
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
    <div className="content-page games-theme">
      <div className="content-header">
        <h1>Videojuegos</h1>
        <p>Explora los mejores títulos del mundo gaming</p>
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
          <p>Cargando videojuegos...</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedVideojuegos.length} videojuegos
          </div>

          <div className="content-grid">
            {sortedVideojuegos.map(juego => (
              <div key={juego.juego_id} className="content-card">
                <Link to={`/videojuegos/${juego.juego_id}`} className="content-link">
                  <div className="poster-container">
                    <img src={juego.portada} alt={juego.titulo} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{juego.titulo}</h3>
                    <p className="content-year">{juego.fecha_lanzamiento}</p>
                    <p className="content-developer">{juego.desarrollador}</p>
                    <div className="game-platforms">
                      {juego.plataformas && juego.plataformas.split(',').map(plataforma => (
                        <span key={plataforma} className="game-platform">
                          {plataforma.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
                <div className="content-actions">
                  <Link 
                    to={`/videojuegos/${juego.juego_id}/reviews`} 
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
              <h3>No se encontraron videojuegos</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Videojuegos;