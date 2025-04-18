// src/components/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, contraseña);
      
      if (result.success) {
        // Redireccionar al usuario a la página principal
        navigate("/");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>
      <div className="login-form-container">
        <h2 className="login-title">Iniciar Sesión</h2>

        <form onSubmit={handleLogin}>
          <div className="login-group">
            <label className="login-label">Email</label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
            />
          </div>
          
          <div className="login-group">
            <label className="login-label">Contraseña</label>
            <input
              className="login-input"
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {error && <div className="login-error-message">{error}</div>}
          
          <button className="login-submit-button" type="submit" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <a href="#" className="login-auth-link">¿Olvidaste tu contraseña?</a>

        <div className="login-divider">o</div>

        <div className="login-social-buttons">
          <button className="login-social-button">
            <i className="fab fa-google"></i>
          </button>
          <button className="login-social-button">
            <i className="fab fa-facebook-f"></i>
          </button>
          <button className="login-social-button">
            <i className="fab fa-apple"></i>
          </button>
        </div>

        <div className="login-footer">
          <span>¿No tienes una cuenta? </span>
          <a href="/signup" className="login-auth-link">Regístrate aquí</a>
        </div>
      </div>
    </div>
  );
};

export default Login;