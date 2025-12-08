import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Navbar.css";
import NotificacionesNav from '../Notificaciones/NotificacionesNav';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Para detectar clics fuera del menú de usuario y búsqueda
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Redirigir a la página de resultados de búsqueda
    navigate(`/busqueda?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleResultClick = (result) => {
    if (result.type === 'usuario') {
      navigate(`/perfil/${result.nombre}`);
    } else {
      navigate(`/${result.type}/${result._id}`);
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleSearchDropdown = () => {
    setShowSearchDropdown(!showSearchDropdown);
    // Enfocar el input cuando se abre el dropdown
    if (!showSearchDropdown) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Identificamos el rol del usuario
  const userRole = user ? user.rol : null;
  
  // Verificamos si la ruta actual está activa para el menú
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Obtenemos las iniciales del usuario para el avatar
  const getUserInitials = () => {
    if (!user || !user.nombre) return user?.email?.charAt(0).toUpperCase() || "?";
    
    const nameParts = user.nombre.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  const isAuthenticated = !!user;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menú"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <div className="logo">
          <Link to="/">StateView</Link>
        </div>
      </div>
      
      {/* Backdrop para cerrar el menú al hacer clic fuera */}
      <div 
        className={`mobile-nav-backdrop ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <div className={`navbar-center ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-categories">
          <Link to="/peliculas" className={isActive("/peliculas") ? "active" : ""}>
            <i className="fas fa-film"></i>
            <span>Películas</span>
          </Link>
          <Link to="/series" className={isActive("/series") ? "active" : ""}>
            <i className="fas fa-tv"></i>
            <span>Series</span>
          </Link>
          <Link to="/videojuegos" className={isActive("/videojuegos") ? "active" : ""}>
            <i className="fas fa-gamepad"></i>
            <span>Videojuegos</span>
          </Link>
          <Link to="/albumes" className={isActive("/albumes") ? "active" : ""}>
            <i className="fas fa-music"></i>
            <span>Álbumes</span>
          </Link>
        </div>
      </div>
      
      <div className="navbar-right">
        {/* Buscador */}
        <div className="navbar-search-wrapper" ref={searchRef}>
          <button 
            className="navbar-search-btn" 
            onClick={() => setShowSearchDropdown(v => !v)}
            title="Buscar"
          >
            <i className="fas fa-search"></i>
          </button>
          
          {showSearchDropdown && (
            <div className="navbar-search-dropdown">
              <form onSubmit={handleSearch} className="navbar-search-form">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="navbar-search-input"
                  placeholder="Buscar películas, series, juegos, usuarios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <div className="navbar-search-results">
                {isSearching && <div className="navbar-search-loading">Buscando...</div>}
                {!isSearching && searchResults.length === 0 && searchQuery && (
                  <div className="navbar-search-noresults">
                    Presiona Enter para ver todos los resultados
                  </div>
                )}
                {!isSearching && searchResults.slice(0, 5).map(result => (
                  <div
                    key={`${result.type}-${result._id || result.id || result.username}`}
                    className="navbar-search-result-item"
                    onClick={() => handleResultClick(result)}
                  >
                    <img
                      src={result.poster || result.portada || result.imagenPerfil || result.avatar || '/default-image.png'}
                      alt={result.titulo || result.nombre}
                      className="navbar-search-result-img"
                    />
                    <div className="navbar-search-result-info">
                      <span className="navbar-search-result-title">{result.titulo || result.nombre}</span>
                      <span className="navbar-search-result-type">{result.type}</span>
                    </div>
                  </div>
                ))}
                {!isSearching && searchResults.length > 5 && (
                  <div className="navbar-search-more" onClick={handleSearch}>
                    Ver más resultados...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notificaciones - Movido aquí para estar junto al buscador */}
        {isAuthenticated && <NotificacionesNav />}

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              {/* Contenedor relativo para el menú de usuario */}
              <div className="user-menu-container" ref={userMenuRef}>
                {/* Avatar de usuario - Botón */}
                <button 
                  className="user-avatar" 
                  onClick={toggleUserMenu}
                  type="button"
                >
                  {user.imagenPerfil ? (
                    <img src={user.imagenPerfil} alt={user.nombre} />
                  ) : (
                    <span className="avatar-circle">
                      {getUserInitials()}
                    </span>
                  )}
                  
                </button>
                
                {/* Menú desplegable - Fuera del botón avatar pero dentro del container relativo */}
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <span className="user-name">{user.nombre || user.email}</span>
                      <span className="user-role">{userRole}</span>
                    </div>
                    
                    <Link to="/perfil" onClick={() => setShowUserMenu(false)}>
                      <i className="fas fa-user"></i> Mi Perfil
                    </Link>
                    
                    {/* Elementos para todos los usuarios */}
                    <Link to="/listas" onClick={() => setShowUserMenu(false)}>
                      <i className="fas fa-list"></i> Mis Listas
                    </Link>

                    {/* Elementos para moderadores, administradores y superadministradores */}
                    {(userRole === "Moderador" || userRole === "Administrador" || userRole === "Superadministrador") && (
                      <>
                        <button 
                          onClick={() => {
                            navigate('/gestionar-insignias');
                            setShowUserMenu(false);
                          }}
                          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: '#ccc' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                        >
                          <i className="fas fa-medal"></i> Gestionar Insignias
                        </button>
                        <Link to="/gestionar-reportes" onClick={() => setShowUserMenu(false)}>
                          <i className="fas fa-flag"></i> Reportes
                        </Link>
                        <Link to="/gestionar-usuario" onClick={() => setShowUserMenu(false)}>
                          <i className="fas fa-users-cog"></i> Gestionar Usuarios
                        </Link>
                        <Link to="/dashboard/users" onClick={() => setShowUserMenu(false)}>
                          <i className="fas fa-chart-bar"></i> Estadísticas
                        </Link>
                      </>
                    )}

                    {/* Elementos para administradores */}
                    {(userRole === "Administrador" || userRole === "Superadministrador") && (
                      <>
                        <Link to="/gestionar-contenido" onClick={() => setShowUserMenu(false)}>
                          <i className="fas fa-database"></i> Gestionar Contenido
                        </Link>
                      </>
                    )}

                    <button onClick={handleLogout} className="logout-button">
                      <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="navbar-login-btn">Iniciar Sesión</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;