import React from "react";
import { Link } from "react-router-dom"; // Importa Link para la navegación interna
import "../../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">StateView</Link> {/* El logo también puede servir como enlace a la página principal */}
      </div>
      <div className="nav-links">
        <Link to="/login" className="nav-button">
          Iniciar Sesión
        </Link>
        <Link to="/signup" className="nav-button">
          Crear Cuenta
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
