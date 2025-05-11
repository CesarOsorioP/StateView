import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  
  // Para detectar clics fuera del menú de usuario
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Cambiado de '/' a '/landing' para redirigir al landing
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
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

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">StateView</Link>
      </div>
      
      <div className="nav-center">
        <div className="nav-categories">
          <Link to="/peliculas" className={isActive("/peliculas") ? "active" : ""}>
            <i className="fas fa-film"></i> Películas
          </Link>
          <Link to="/series" className={isActive("/series") ? "active" : ""}>
            <i className="fas fa-tv"></i> Series
          </Link>
          <Link to="/videojuegos" className={isActive("/videojuegos") ? "active" : ""}>
            <i className="fas fa-gamepad"></i> Videojuegos
          </Link>
          <Link to="/albumes" className={isActive("/albumes") ? "active" : ""}>
            <i className="fas fa-music"></i> Álbumes
          </Link>
        </div>
        
        {user && (
          <form className="nav-search" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Buscar películas, series, juegos..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">
              <i className="fas fa-search"></i>
            </button>
          </form>
        )}
      </div>
      
      <div className="nav-links">
        {user ? (
          <div className="user-menu-container" ref={userMenuRef}>
            {/* Mostrar notificaciones para críticos, moderadores y administradores */}
            {(userRole === "Critico" || userRole === "Moderador" || userRole === "Administrador" || userRole === "Superadministrador") && (
              <div className="notification-icon">
                <i className="fas fa-bell"></i>
                <span className="notification-badge">3</span>
              </div>
            )}
            
            <div className="user-avatar" onClick={toggleUserMenu}>
              <span className="avatar-circle" style={{
                background: userRole === "Superadministrador" ? "linear-gradient(135deg, #8B0000, #FF0000)" :
                          userRole === "Administrador" ? "linear-gradient(135deg, #ff7f50, #ff4500)" :
                          userRole === "Moderador" ? "linear-gradient(135deg, #4682b4, #1e90ff)" :
                          userRole === "Critico" ? "linear-gradient(135deg, #ffd700, #ff8c00)" :
                          "linear-gradient(135deg, #6a5acd, #9370db)"
              }}>
                {getUserInitials()}
              </span>
              {userRole && (
                <span className="role-indicator" title={userRole}>
                  {userRole === "Superadministrador" && <i className="fas fa-user-shield"></i>}
                  {userRole === "Administrador" && <i className="fas fa-crown"></i>}
                  {userRole === "Moderador" && <i className="fas fa-shield-alt"></i>}
                  {userRole === "Critico" && <i className="fas fa-feather-alt"></i>}
                </span>
              )}
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-name">{user.nombre || user.email}</span>
                  <span className="user-role">{userRole}</span>
                </div>
                
                <Link to="/perfil"><i className="fas fa-user"></i> Mi Perfil</Link>
                
                {/* Elementos para todos los usuarios */}
                <Link to="/mis-reseñas"><i className="fas fa-comment-alt"></i> Mis Reseñas</Link>
                <Link to="/listas"><i className="fas fa-list"></i> Mis Listas</Link>
                <Link to="/favoritos"><i className="fas fa-heart"></i> Favoritos</Link>

                
                {/* Elementos para críticos */}
                {userRole === "Critico" && (
                  <>
                    <Link to="/mis-criticas"><i className="fas fa-star"></i> Mis Críticas</Link>
                    <Link to="/estadisticas"><i className="fas fa-chart-line"></i> Estadísticas</Link>
                    <Link to="/borradores"><i className="fas fa-file-alt"></i> Borradores</Link>
                  </>
                )}
                
                {/* Elementos para moderadores */}
                {(userRole === "Moderador" || userRole === "Administrador" || userRole === "Superadministrador") && (
                  <>
                    <Link to="/gestionar-reportes"><i className="fas fa-flag"></i> Reportes</Link>
                    <Link to="/gestionar-usuario"><i className="fas fa-users-cog"></i> Gestionar Usuarios</Link>
                  </>
                )}
                
                {/* Elementos para administradores */}
                {(userRole === "Administrador" || userRole === "Superadministrador") && (
                  <>
                    <Link to="/gestionar-contenido"><i className="fas fa-database"></i> Gestionar Contenido</Link>

                  </>
                )}
                
               

                <Link to="/configuracion"><i className="fas fa-cog"></i> Configuración</Link>
                <button onClick={handleLogout} className="logout-button">
                  <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-button">
              <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
            </Link>
            <Link to="/signup" className="nav-button">
              <i className="fas fa-user-plus"></i> Crear Cuenta
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;