import React from "react";
import "./styles/app.css";
import duneImage from "./images/dune.avif";

const App = () => {
  return (
    <div className="container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">StateView</div>
        <div className="nav-links">
          <button className="nav-button">Iniciar Sesion</button>
          <button className="nav-button">Crear Cuenta</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero">
        <img src={duneImage}
        alt="Background" className="hero-image"
        />

        <div className="hero-content">
          <h1>Explora, Comparte y Descubre.</h1>
          <h3>Descubre nuevas historias recomendadas por
            una comunidad apasionada por el entretenimiento.</h3>
          <button className="cta-button">Únete ahora y comparte tu opinion</button>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        Tu lugar para encontrar recomendaciones y reseñas multimedia.
      </footer>
    </div>
  );
};

export default App;
