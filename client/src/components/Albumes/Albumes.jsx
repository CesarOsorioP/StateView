// src/components/Albumes.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Albumes.css";
import api from '../../api/api'


const Albumes = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: "all",
    sort: "asc" // "asc" = de más antiguos a más recientes, "desc" = lo inverso
  });

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        // Llama al endpoint correcto: /api/albums (en plural, según tu server.js)
        const response = await api.get("/api/albums");
        setAlbums(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching albums:", error);
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  // Extrae los años únicos a partir de los álbumes obtenidos
  // Se asume que 'fecha_estreno' es un string (por ejemplo "1969" o "1969-05-20")
  const years = ["all", ...new Set(albums.map(album => {
    let year = album.fecha_estreno;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  // Aplica el filtro de año
  const filteredAlbums = albums.filter(album => {
    if (filters.year !== "all") {
      let albumYear = album.fecha_estreno;
      if (albumYear && albumYear.length > 4) {
        albumYear = albumYear.substring(0, 4);
      }
      return albumYear === filters.year;
    }
    return true;
  });

  // Ordena por año: ascendente (más antiguo) o descendente (más reciente)
  const sortedAlbums = [...filteredAlbums].sort((a, b) => {
    let yearA = a.fecha_estreno ? parseInt(a.fecha_estreno.substring(0, 4)) : 0;
    let yearB = b.fecha_estreno ? parseInt(b.fecha_estreno.substring(0, 4)) : 0;
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
        <h1>Álbumes</h1>
        <p>Explora y descubre los mejores álbumes musicales</p>
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
          <p>Cargando álbumes...</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedAlbums.length} álbumes
          </div>

          <div className="content-grid">
            {sortedAlbums.map(album => (
              <div key={album.album_id} className="content-card">
                <Link to={`/albumes/${album.album_id}`} className="content-link">
                  <div className="poster-container">
                    <img src={album.portada} alt={album.nombre} className="poster" />
                  </div>
                  <div className="content-info">
                    <h3 className="content-title">{album.nombre}</h3>
                    <p className="content-year">{album.fecha_estreno}</p>
                    <p className="content-artist">{album.artista && album.artista.nombre}</p>
                  </div>
                </Link>
                <div className="content-actions">
                  {/* Enlace para ir a la página de reseñas para este álbum */}
                  <Link 
                    to={`/albumes/${album.album_id}/reviews`} 
                    className="action-button" 
                    title="Reseñar álbum"
                  >
                    <i className="far fa-star"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {sortedAlbums.length === 0 && (
            <div className="no-results">
              <h3>No se encontraron álbumes con los filtros seleccionados</h3>
              <p>Intenta cambiar tus filtros para ver más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Albumes;
