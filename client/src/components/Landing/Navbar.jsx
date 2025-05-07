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
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Ahora usamos 'user.rol' ya que se asigna correctamente en AuthContext
  const isAdmin = user && user.rol === "Administrador";

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
              <span className="avatar-circle">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <Link to="/perfil">Mi Perfil</Link>
                <Link to="/mis-reseñas">Mis Reseñas</Link>
                <Link to="/listas">Mis Listas</Link>
                <Link to="/favoritos">Favoritos</Link>
                <Link to="/configuracion">Configuración</Link>

                {isAdmin && (
                  <>
                      <Link to="/crear-admin">Crear Administrador</Link>
                      <Link to="/gestionar-moderador">Gestionar Moderador</Link>
                      <Link to="/gestionar-usuario">Gestionar Usuario</Link>
                      <Link to="/gestionar-contenido">Gestionar Contenido</Link>
                      <Link to="/gestionar-advertencias">Gestionar Advertencias</Link>
                      <Link to="/mis-insignias">Mis Insignias</Link>
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
