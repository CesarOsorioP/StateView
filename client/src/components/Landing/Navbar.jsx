// src/components/Navbar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    // Al cambiar el estado de autenticación, se actualizarán los componentes automáticamente
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">StateView</Link>
      </div>
      
      <div className="nav-center">
        <div className="nav-categories">
          <Link to="/peliculas">Películas</Link>
          <Link to="/series">Series</Link>
          <Link to="/videojuegos">Videojuegos</Link>
          <Link to="/albumes">Álbumes</Link>
        </div>
        
        {user && (
          <div className="nav-search">
            <input 
              type="text" 
              placeholder="Buscar películas, series, juegos..." 
              className="search-input" 
            />
            <button className="search-button">
              <i className="fas fa-search"></i>
            </button>
          </div>
        )}
      </div>
      
      <div className="nav-links">
        {user ? (
          <div className="user-menu-container">
            <div className="user-avatar" onClick={toggleUserMenu}>
              {/* Uso de la primera letra del email como avatar */}
              <span className="avatar-circle">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <Link to="/perfil">Mi Perfil</Link>
                <Link to="/mis-reseñas">Mis Reseñas</Link>
                <Link to="/favoritos">Favoritos</Link>
                <Link to="/configuracion">Configuración</Link>

                {/* Opciones exclusivas para Administradores */}
                {user.rol === "Administrador" && (
                  <>
                    <Link to="/crear-admin">Crear Administrador</Link>
                    <Link to="/crear-moderador">Crear Moderador</Link>
                  </>
                )}

                {/* Opciones exclusivas para Moderadores */}
                {user.rol === "Moderador" && (
                  <>
                    <Link to="/gestionar-advertencias">Gestionar Advertencias</Link>
                    {/* Puedes agregar más funcionalidades para moderadores aquí */}
                  </>
                )}

                {/* Opciones exclusivas para Críticos */}
                {user.rol === "Critico" && (
                  <>
                    <Link to="/mis-insignias">Mis Insignias</Link>
                    {/* Otras funcionalidades exclusivas para críticos */}
                  </>
                )}

                <button onClick={handleLogout} className="logout-button">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-button">
              Iniciar Sesión
            </Link>
            <Link to="/signup" className="nav-button">
              Crear Cuenta
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
