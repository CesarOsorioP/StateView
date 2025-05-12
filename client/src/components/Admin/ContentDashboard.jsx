// src/components/admin/ContentDashboard.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api"; // Importamos la configuración de API

const ContentDashboard = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");

  useEffect(() => {
    // Obtener la URL base de la configuración de API
    const baseURL = api.defaults.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Crear la conexión socket usando la misma URL base
    const socket = io(baseURL, {
      path: "/socket.io", // Ajustar según la configuración de tu servidor
      auth: { token: localStorage.getItem("token") }
    });

    // Inicialmente cargar datos a través de API REST
    const fetchInitialData = async () => {
      try {
        const response = await api.get("/api/dashboard/content/stats");
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas iniciales:", error);
      }
    };

    fetchInitialData();

    socket.on("connect", () => {
      console.log("Conectado al dashboard de contenido");
      setConnectionStatus("Conectado");
    });

    socket.on("contentStats", (data) => {
      console.log("Estadísticas de contenido actualizadas:", data);
      setStats(data);
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión con socket:", err);
      setConnectionStatus(`Error: ${err.message}`);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del dashboard de contenido");
      setConnectionStatus("Desconectado");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) return <div>Cargando...</div>;

  const allowedRoles = ["Administrador", "Superadmin", "Superadministrador", "Moderador"];
  if (!user || !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="dashboard-container">
      <h2>Dashboard de Contenido</h2>
      <div className="connection-status">
        Estado: {connectionStatus}
      </div>
      {Object.keys(stats).length > 0 ? (
        <div className="stats-container">
          <h3>Estadísticas</h3>
          <ul>
            {Object.entries(stats).map(([tipo, count]) => (
              <li key={tipo}>{tipo}: {count}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Cargando estadísticas...</p>
      )}
    </div>
  );
};

export default ContentDashboard;