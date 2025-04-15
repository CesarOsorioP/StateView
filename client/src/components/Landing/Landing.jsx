import React, { useState, useEffect } from "react";
import "../../styles/Landing.css";

const images = [
  require("../../images/dune.avif"),
  require("../../images/interstellar.png"),
  require("../../images/bladerunner.jpg"),
];

const Landing = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page">
      <div
        className="hero"
        style={{ backgroundImage: `url(${images[currentImage]})` }}
      >
        <div className="hero-content">
          <h1>Explora, Comparte y Descubre.</h1>
          <h3>
            Descubre nuevas historias recomendadas por una comunidad apasionada
            por el entretenimiento.
          </h3>
          <button className="cta-button">Únete ahora y comparte tu opinión</button>
        </div>
      </div>

    </div>
  );
};

export default Landing;