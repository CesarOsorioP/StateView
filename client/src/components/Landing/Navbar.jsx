import React from "react";
import "../../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">StateView</div>
      <div className="nav-links">
        <button className="nav-button">Iniciar Sesión</button>
        <button className="nav-button">Crear Cuenta</button>
      </div>
    </nav>
  );
};

export default Navbar;