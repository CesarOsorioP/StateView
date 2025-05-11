// src/components/Albumes.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Albumes.css";
import api from '../../api/api';

const Albumes = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]);
  const [filters, setFilters] = useState({
    year: "all",
    yearRange: {
      from: "",
      to: ""
    },
    artist: "all",
    sort: "asc" // "asc" = de más antiguos a más recientes, "desc" = lo inverso
  });

  // Función para generar ID único para un artista
  const getArtistId = (artist) => {
    return artist.artista_id || `nombre-${artist.nombre}`;
  };

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await api.get("/api/albums");
        const albumsData = response.data;
        setAlbums(albumsData);
        
        // Extraer artistas únicos - usando nombre del artista como identificador primario
        // cuando artista_id está vacío
        const artistsMap = new Map();
        
        albumsData.forEach(album => {
          if (album.artista && album.artista.nombre) {
            const artistId = getArtistId(album.artista);
            
            // Solo agregar si no existe o actualizar el existente
            if (!artistsMap.has(artistId)) {
              artistsMap.set(artistId, {
                id: artistId,
                nombre: album.artista.nombre
              });
            }
          }
        });
        
        const uniqueArtists = Array.from(artistsMap.values());
        
        setArtists(uniqueArtists);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching albums:", error);
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  // Extrae los años únicos para el selector de año individual
  const years = ["all", ...new Set(albums.map(album => {
    let year = album.fecha_estreno;
    if (year && year.length > 4) {
      year = year.substring(0, 4);
    }
    return year;
  }).filter(Boolean))];

  // Encuentra el año mínimo y máximo para el selector de rango
  const allYears = albums
    .map(album => album.fecha_estreno ? parseInt(album.fecha_estreno.substring(0, 4)) : null)
    .filter(Boolean);
  
  const minYear = allYears.length > 0 ? Math.min(...allYears) : 1900;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();

  // Aplica todos los filtros
  const filteredAlbums = albums.filter(album => {
    // Extraer año del álbum
    let albumYear = album.fecha_estreno;
    if (albumYear && albumYear.length > 4) {
      albumYear = albumYear.substring(0, 4);
    }
    const yearNum = albumYear ? parseInt(albumYear) : 0;
    
    // Filtro por año específico
    if (filters.year !== "all" && albumYear !== filters.year) {
      return false;
    }
    
    // Filtro por rango de años
    if (filters.year === "all" && 
        ((filters.yearRange.from && yearNum < parseInt(filters.yearRange.from)) || 
         (filters.yearRange.to && yearNum > parseInt(filters.yearRange.to)))) {
      return false;
    }
    
    // Filtro por artista - CORREGIDO para manejar artista_id vacío
    if (filters.artist !== "all") {
      // Verificar si el álbum tiene información de artista
      if (!album.artista || !album.artista.nombre) {
        return false;
      }
      
      // Usar la misma función para generar el ID del artista
      const albumArtistId = getArtistId(album.artista);
      
      // Comparar con el ID del filtro seleccionado
      if (albumArtistId !== filters.artist) {
        return false;
      }
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

  return (
    <div className="content-page">
      <div className="content-header">
        <h1>Álbumes</h1>
        <p>Explora y descubre los mejores álbumes musicales</p>
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
            <label>Artista</label>
            <select 
              name="artist" 
              value={filters.artist} 
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">Todos los artistas</option>
              {artists
                .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente
                .map(artist => (
                  <option 
                    key={artist.id || `artist-${artist.nombre}`} 
                    value={artist.id || ''}
                  >
                    {artist.nombre || 'Artista desconocido'}
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
              artist: "all",
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
          <p>Cargando álbumes...</p>
        </div>
      ) : (
        <>
          <div className="content-count">
            Mostrando {sortedAlbums.length} álbumes
          </div>

          <div className="content-grid">
            {sortedAlbums.map(album => (
              <div key={album.album_id || `album-${album.nombre}`} className="content-card">
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