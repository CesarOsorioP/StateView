    // src/components/Albumes.jsx
    import React, { useState, useEffect } from "react";
    import { Link } from "react-router-dom";
    import "./Albumes.css";
    import api from '../../api/api';

    const Albumes = () => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [artists, setArtists] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [filters, setFilters] = useState({
        year: "all",
        yearRange: {
        from: "",
        to: ""
        },
        artist: "all",
        sort: "asc"
    });

    // Función para generar ID único para un artista
    const getArtistId = (artist) => {
        return artist.artista_id || `nombre-${artist.nombre}`;
    };

    useEffect(() => {
        const fetchAlbums = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/api/album");
            
            if (!response.data || !Array.isArray(response.data.data)) {
            throw new Error('La respuesta de la API no es un array válido');
            }

            const albumsData = response.data.data;
            setAlbums(albumsData);
            
            const artistsMap = new Map();
            
            albumsData.forEach(album => {
            if (album.artista && album.artista.nombre) {
                const artistId = getArtistId(album.artista);
                
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
        } catch (error) {
            console.error("Error fetching albums:", error);
            setError('Error al cargar los álbumes. Por favor, intenta de nuevo más tarde.');
            setAlbums([]);
        } finally {
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
        let albumYear = album.fecha_estreno;
        if (albumYear && albumYear.length > 4) {
        albumYear = albumYear.substring(0, 4);
        }
        const yearNum = albumYear ? parseInt(albumYear) : 0;
        
        if (filters.year !== "all" && albumYear !== filters.year) {
        return false;
        }
        
        if (filters.year === "all" && 
            ((filters.yearRange.from && yearNum < parseInt(filters.yearRange.from)) || 
            (filters.yearRange.to && yearNum > parseInt(filters.yearRange.to)))) {
        return false;
        }
        
        if (filters.artist !== "all") {
        if (!album.artista || !album.artista.nombre) {
            return false;
        }
        
        const albumArtistId = getArtistId(album.artista);
        
        if (albumArtistId !== filters.artist) {
            return false;
        }
        }
        
        return true;
    });

    // Ordena por año
    const sortedAlbums = [...filteredAlbums].sort((a, b) => {
        let yearA = a.fecha_estreno ? parseInt(a.fecha_estreno.substring(0, 4)) : 0;
        let yearB = b.fecha_estreno ? parseInt(b.fecha_estreno.substring(0, 4)) : 0;
        return filters.sort === "asc" ? yearA - yearB : yearB - yearA;
    });

    // Lógica de paginación
    const totalPages = Math.ceil(sortedAlbums.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAlbums = sortedAlbums.slice(startIndex, endIndex);

    // Resetear página cuando cambien los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

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
        if (name === "year" && value !== "all") {
            setFilters(prev => ({
            ...prev,
            [name]: value,
            yearRange: { from: "", to: "" }
            }));
        } else {
            setFilters(prev => ({
            ...prev,
            [name]: value
            }));
        }
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPaginationRange = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); 
            i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
        }

        if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
        } else {
        rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
        } else {
        rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (error) {
        return (
        <div className="content-page">
            <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            </div>
        </div>
        );
    }

    return (
        <div className="content-page">
        <div className="content-header">
            <h1>Álbumes</h1>
            <p>Explora y descubre los mejores álbumes musicales</p>
        </div>

        <div className="filters-container compact-filters">
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
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
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
                Mostrando {startIndex + 1}-{Math.min(endIndex, sortedAlbums.length)} de {sortedAlbums.length} álbumes
                {totalPages > 1 && (
                <span className="page-indicator"> | Página {currentPage} de {totalPages}</span>
                )}
            </div>

            <div className="content-grid compact-grid">
                {currentAlbums.map(album => (
                <div key={album.album_id || album._id} className="content-card">
                    <Link to={`/album/${album.album_id || album._id}`} className="content-link">
                    <div className="poster-container">
                        <img 
                        src={album.portada} 
                        alt={album.titulo || album.nombre || album.Title || 'Álbum'} 
                        className="poster"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                        }}
                        />
                    </div>
                    <div className="content-info">
                        <h3 className="content-title">{album.titulo || album.nombre || album.Title || 'Álbum'}</h3>
                        <p className="content-year">{album.fecha_estreno ? album.fecha_estreno.substring(0, 4) : ''}</p>
                        <p className="content-artist">{album.artista && album.artista.nombre}</p>
                    </div>
                    </Link>
                </div>
                ))}
            </div>

            {/* Paginación */}
            <div className="pagination-bar">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                    key={i + 1}
                    className={currentPage === i + 1 ? 'active' : ''}
                    onClick={() => handlePageChange(i + 1)}
                    >
                    {i + 1}
                    </button>
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