import React, { useState } from "react";
import axios from "axios";
import "./Signup.css";
import api from '../../api/api'

const Signup = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/api/auth/signup", {
        nombre,
        email,
        contraseña,
      });
      setSuccess(response.data.message || "Registro exitoso. ¡Ya puedes iniciar sesión!");
      setIsLoading(false);

      // Resetear los campos tras un registro exitoso
      setNombre("");
      setEmail("");
      setContraseña("");
      setConfirmarContraseña("");
      setAceptaTerminos(false);
    } catch (error) {
      const mensajeError = error.response?.data?.error || "Error desconocido al registrarse.";
      setError(mensajeError);
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-bg"></div>
      <div className="signup-form-container">
        <h2 className="signup-title">Crear Cuenta</h2>

        <form onSubmit={handleSignup}>
          <div className="signup-group">
            <label className="signup-label">Nombre de Usuario</label>
            <input
              className="signup-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre completo"
              required
            />
          </div>

          <div className="signup-group">
            <label className="signup-label">Email</label>
            <input
              className="signup-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              required
            />
          </div>

          <div className="signup-group">
            <label className="signup-label">Contraseña</label>
            <input
              className="signup-input"
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              placeholder="Crea una contraseña"
              required
            />
            <div className="signup-validation-hint">
              La contraseña debe tener al menos 8 caracteres
            </div>
          </div>

          <div className="signup-group">
            <label className="signup-label">Confirmar contraseña</label>
            <input
              className="signup-input"
              type="password"
              value={confirmarContraseña}
              onChange={(e) => setConfirmarContraseña(e.target.value)}
              placeholder="Confirma tu contraseña"
              required
            />
          </div>

          <div className="signup-terms-section">
            <input
              type="checkbox"
              id="signup-terminos"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />
            <label htmlFor="signup-terminos">
              Acepto los <a href="/terminos">Términos y Condiciones</a> y la <a href="/privacidad">Política de Privacidad</a>
            </label>
          </div>

          {error && <div className="signup-error-message">{error}</div>}
          {success && <div className="signup-success-message">{success}</div>}

          <button className="signup-submit-button" type="submit" disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <div className="signup-divider">o</div>

        <div className="signup-social-buttons">
          <button className="signup-social-button">
            <i className="fab fa-google"></i>
          </button>
          <button className="signup-social-button">
            <i className="fab fa-facebook-f"></i>
          </button>
          <button className="signup-social-button">
            <i className="fab fa-apple"></i>
          </button>
        </div>

        <div className="signup-footer">
          <span>¿Ya tienes una cuenta? </span>
          <a href="/login" className="signup-auth-link">Inicia sesión aquí</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
