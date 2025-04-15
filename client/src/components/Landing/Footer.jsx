import React from "react";
import "../../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>StateView</h4>
          <p>Visualiza y gestiona tus datos de forma sencilla</p>
        </div>
        
        <div className="footer-section">
          <h4>Enlaces rápidos</h4>
          <ul className="footer-links">
            <li><a href="/">Inicio</a></li>
            <li><a href="/features">Características</a></li>
            <li><a href="/pricing">Precios</a></li>
            <li><a href="/contact">Contacto</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Síguenos</h4>
          <div className="footer-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 StateView - Todos los derechos reservados</p>
      </div>
    </footer>
  );
};

export default Footer;