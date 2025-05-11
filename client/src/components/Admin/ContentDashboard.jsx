// src/components/admin/ContentDashboard.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ContentDashboard = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    const socket = io("http://localhost:5000/dashboard/content", {
      auth: { token: localStorage.getItem("token") }
    });

    socket.on("connect", () => {
      console.log("Conectado al dashboard de contenido");
    });

    socket.on("contentStats", (data) => {
      console.log("Estadísticas de contenido:", data);
      setStats(data);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del dashboard de contenido");
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
    <div>
      <h2>Dashboard de Contenido</h2>
      <ul>
        {Object.entries(stats).map(([tipo, count]) => (
          <li key={tipo}>{tipo}: {count}</li>
        ))}
      </ul>
    </div>
  );
};

export default ContentDashboard;
