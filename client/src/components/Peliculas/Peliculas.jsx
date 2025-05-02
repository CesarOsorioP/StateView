import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Peliculas.css";

const Peliculas = () => {
  const [peliculas, setPeliculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc" // "asc" = A-Z, "desc" = Z-A
  });

  useEffect(() => {
    const fetchPeliculas = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/peliculas");
        setPeliculas(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setLoading(false);
      }
    };

    fetchPeliculas();
  }, []);

  // Extrae los años únicos
  const years = ["all", ...new Set(peliculas.map(pelicula => {
    let year = pelicula.fecha_estreno;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  // Filtra por año
  const filteredPeliculas = peliculas.filter(pelicula => {
    if (filters.year !== "all") {
      let peliculaYear = pelicula.fecha_estreno;
      if (peliculaYear && peliculaYear.length > 4) {
        peliculaYear = peliculaYear.substring(0, 4);
      }
      return peliculaYear === filters.year;
    }
    return true;
  });

  // Ordena por título
  const sortedPeliculas = [...filteredPeliculas].sort((a, b) => {
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
    <div className="content-page movies-theme">
      <div className="content-header">
        <h1>Películas</h1>
        <p>Explora nuestra colección de películas</p>
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
                    <img src={pelicula.portada} alt={pelicula.titulo} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{pelicula.titulo}</h3>
                    <p className="content-year">{pelicula.fecha_estreno}</p>
                    <p className="content-director">{pelicula.director}</p>
                  </div>
                </Link>
                <div className="content-actions">
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
              <h3>No se encontraron películas</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Peliculas;