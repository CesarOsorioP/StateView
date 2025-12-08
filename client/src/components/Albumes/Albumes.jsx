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
    const itemsPerPage = 18;
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

    // Ordena por año o alfabéticamente
    const sortedAlbums = [...filteredAlbums].sort((a, b) => {
        if (filters.sort === "alphabetical") {
            const titleA = (a.titulo || a.nombre || a.Title || '').toLowerCase();
            const titleB = (b.titulo || b.nombre || b.Title || '').toLowerCase();
            return titleA.localeCompare(titleB, 'es');
        }
        let yearA = a.fecha_estreno ? parseInt(a.fecha_estreno.substring(0, 4)) : 0;
        let yearB = b.fecha_estreno ? parseInt(b.fecha_estreno.substring(0, 4)) : 0;
        return filters.sort === "asc" ? yearA - yearB : yearB - yearA;
    });

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

    if (error) {
        return (
        <div className="album-content-page">
            <div className="album-error-container">
            <h2>Error</h2>
            <p className="album-error-message">{error}</p>
            </div>
        </div>
        );
    }

    return (
        <div className="album-content-page">
        <div className="album-content-header">
            <h1>Álbumes</h1>
            <p>Explora y descubre los mejores álbumes musicales</p>
        </div>

        <div className="album-filters-bar-horizontal">
            <select 
            name="year" 
            value={filters.year} 
            onChange={handleFilterChange}
            className="album-filter-select"
            >
            {years.map(year => (
                <option key={year || 'unknown'} value={year || ''}>
                {year === "all" ? "Todos los años" : (year || 'Año desconocido')}
                </option>
            ))}
            </select>
            {filters.year === "all" && (
            <>
                <input
                type="number"
                name="from"
                placeholder="Desde"
                min={minYear}
                max={maxYear}
                value={filters.yearRange.from}
                onChange={handleFilterChange}
                className="album-filter-input"
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
                className="album-filter-input"
                />
            </>
            )}
            <select 
            name="artist" 
            value={filters.artist} 
            onChange={handleFilterChange}
            className="album-filter-select"
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
            <select 
            name="sort" 
            value={filters.sort} 
            onChange={handleFilterChange}
            className="album-filter-select"
            >
            <option value="asc">Más antiguos</option>
            <option value="desc">Más recientes</option>
            <option value="alphabetical">A - Z</option>
            </select>
            <button 
            className="album-clear-filters-btn"
            onClick={() => setFilters({
                year: "all",
                yearRange: { from: "", to: "" },
                artist: "all",
                sort: "asc"
            })}
            >
            Limpiar
            </button>
        </div>

        {loading ? (
            <div className="album-loading-container">
            <div className="album-loading-spinner"></div>
            <p>Cargando álbumes...</p>
            </div>
        ) : (
            <>
            <div className="album-content-count">
                Mostrando {sortedAlbums.length} álbumes
            </div>

            <div className="album-pagination-bar">
                {Array.from({ length: Math.ceil(sortedAlbums.length / itemsPerPage) }, (_, i) => (
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
                <div className="album-pagination-jump">
                <span>Ir a:</span>
                <input
                    type="number"
                    min="1"
                    max={Math.ceil(sortedAlbums.length / itemsPerPage)}
                    value={currentPage}
                    onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= Math.ceil(sortedAlbums.length / itemsPerPage)) {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= Math.ceil(sortedAlbums.length / itemsPerPage)) {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }
                    }}
                    className="album-pagination-input"
                />
                <span>de {Math.ceil(sortedAlbums.length / itemsPerPage)}</span>
                </div>
            </div>

            <div className="album-content-grid compact-grid ultra-compact-grid">
                {sortedAlbums.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(album => (
                <div key={album.album_id || album._id} className="album-content-card">
                    <Link to={`/album/${album.album_id || album._id}`} className="album-content-link">
                    <div className="album-poster-container">
                        <img 
                        src={album.portada} 
                        alt={album.titulo || album.nombre || album.Title || 'Álbum'} 
                        className="album-poster"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                        }}
                        />
                    </div>
                    <div className="album-content-info">
                        <h3 className="album-content-title">{album.titulo || album.nombre || album.Title || 'Álbum'}</h3>
                        <p className="album-content-year">{album.fecha_estreno ? album.fecha_estreno.substring(0, 4) : ''}</p>
                        <p className="album-content-artist">{album.artista && album.artista.nombre}</p>
                    </div>
                    </Link>
                </div>
                ))}
            </div>

            {sortedAlbums.length === 0 && (
                <div className="album-no-results">
                <h3>No se encontraron álbumes con los filtros seleccionados</h3>
                <p>Intenta cambiar tus filtros para ver más resultados</p>
                </div>
            )}

            {/* Paginación al final */}
            {sortedAlbums.length > 0 && (
                <div className="album-pagination-bar">
                {Array.from({ length: Math.ceil(sortedAlbums.length / itemsPerPage) }, (_, i) => (
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
                <div className="album-pagination-jump">
                    <span>Ir a:</span>
                    <input
                    type="number"
                    min="1"
                    max={Math.ceil(sortedAlbums.length / itemsPerPage)}
                    value={currentPage}
                    onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= Math.ceil(sortedAlbums.length / itemsPerPage)) {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= Math.ceil(sortedAlbums.length / itemsPerPage)) {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }
                    }}
                    className="album-pagination-input"
                    />
                    <span>de {Math.ceil(sortedAlbums.length / itemsPerPage)}</span>
                </div>
                </div>
            )}
            </>
        )}
        </div>
    );
    };

    export default Albumes;