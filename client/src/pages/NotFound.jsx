import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-glow"></div>
        <div className="notfound-icon">404</div>
        <h1>Página no encontrada</h1>
        <p>
          Parece que la ruta que buscas no existe. Revisa la URL o regresa al inicio.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="notfound-btn primary">Ir al inicio</Link>
          <Link to="/peliculas" className="notfound-btn secondary">Ver contenido</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

