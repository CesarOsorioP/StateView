// src/components/Videojuegos.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Videojuegos = () => {
  const [videojuegos, setVideojuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc" // "asc" = de más antiguos a más recientes, "desc" = lo inverso
  });

  useEffect(() => {
    const fetchVideojuegos = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/videojuegos");
        setVideojuegos(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching videojuegos:", error);
        setLoading(false);
      }
    };

    fetchVideojuegos();
  }, []);

  // Extrae los años únicos a partir de los videojuegos obtenidos
  // Se asume que 'fecha_lanzamiento' es un string (por ejemplo "2020" o "2020-09-17")
  const years = ["all", ...new Set(videojuegos.map(videojuego => {
    let year = videojuego.fecha_lanzamiento;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  // Aplica el filtro de año
  const filteredVideojuegos = videojuegos.filter(videojuego => {
    if (filters.year !== "all") {
      let gameYear = videojuego.fecha_lanzamiento;
      if (gameYear && gameYear.length > 4) {
        gameYear = gameYear.substring(0, 4);
      }
      return gameYear === filters.year;
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="content-page">
      <div className="content-header">
        <h1>Videojuegos</h1>
        <p>Explora y descubre los mejores videojuegos de todos los tiempos</p>
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
            <option value="asc">Más antiguos</option>
            <option value="desc">Más recientes</option>
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
            {sortedVideojuegos.map(videojuego => (
              <div key={videojuego.videojuego_id} className="content-card">
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
                <div className="content-actions">
                  {/* Enlace para ir a la página de reseñas para este videojuego */}
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