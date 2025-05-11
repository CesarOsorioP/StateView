// src/components/admin/UserDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  LinearScale
} from "chart.js";
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserDashboard.css";

// Registrar los componentes necesarios en Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, Title, LinearScale);

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const prevStatsRef = useRef({});
  const chartRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:5000/dashboard/users", {
      auth: { token: localStorage.getItem("token") }
    });

    socket.on("connect", () => {
      console.log("Conectado al dashboard de usuarios");
      setIsConnected(true);
    });

    socket.on("userStats", (data) => {
      console.log("Estadísticas de usuarios (por Estado):", data);
      
      // Comparar con datos anteriores para determinar si hay cambios significativos
      const prevStats = prevStatsRef.current;
      const hasChanged = !prevStats || 
                          Object.keys(prevStats).length !== Object.keys(data).length || 
                          Object.keys(data).some(key => prevStats[key] !== data[key]);
      
      if (hasChanged) {
        prevStatsRef.current = { ...data };
        setStats(data);
        setLastUpdate(new Date());
      }
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del dashboard de usuarios");
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  const allowedRoles = ["Administrador", "Superadmin", "Superadministrador", "Moderador"];
  if (!user || !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  // Preparación de datos para la gráfica Doughnut (agrupados por estado)
  const labels = Object.keys(stats); // Por ejemplo: ["Activo", "Restringido", ...]
  const values = Object.values(stats);
  const total = values.reduce((acc, curr) => acc + curr, 0);
  
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Cantidad de Usuarios",
        data: values,
        backgroundColor: [
          "#9d4edd", // Puedes personalizar según cada estado
          "#c77dff",
          "#7b2cbf",
          "#5a189a",
          "#3c096c"
        ],
        borderColor: "#121212",
        borderWidth: 2,
        hoverOffset: 15
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // Ajusta el grosor del "anillo"
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          color: "#e0e0e0",
          font: {
            size: 14
          },
          padding: 20
        }
      },
      title: { 
        display: true, 
        text: 'Distribución de Estados de Usuarios',
        color: "#e0e0e0",
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      duration: 500,
      animateScale: false,
      animateRotate: false
    },
    plugins: [{
      id: 'consistentColors',
      beforeUpdate: (chart) => {
        const colorMap = {
          "Activo": "#9d4edd",
          "Restringido": "#c77dff",
          "Advertido": "#7b2cbf",
          "Desactivado": "#5a189a"
        };
        if (chart.data && chart.data.labels) {
          const newColors = chart.data.labels.map(label => 
            colorMap[label] || "#9d4edd"
          );
          chart.data.datasets[0].backgroundColor = newColors;
        }
      }
    }]
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Panel de Control de Usuarios</h1>
        <div className="user-info">
          <span className="user-name">{user?.nombre || "Usuario"}</span>
          <span className="user-role">{user?.rol || "Sin rol"}</span>
        </div>
      </header>

      <div className="dashboard-status">
        <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>
        {lastUpdate && (
          <div className="last-update">
            Última actualización: {formatDate(lastUpdate)}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2>Distribución de Usuarios (por Estado)</h2>
          </div>
          <div className="chart-container">
            <Doughnut 
              ref={chartRef}
              data={data} 
              options={options} 
            />
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <h2>Resumen</h2>
            {isConnected && (
              <div className="pulse-indicator" title="Actualizaciones en tiempo real activas"></div>
            )}
          </div>
          <div className="stats-content">
            <div className="stats-total">
              <span className="stats-label">Total de Usuarios</span>
              <span className="stats-value">{total}</span>
            </div>
            <div className="stats-list">
              {labels.map((label, index) => (
                <div className="stats-item" key={label}>
                  <div className="stats-color" style={{ backgroundColor: data.datasets[0].backgroundColor[index % (data.datasets[0].backgroundColor.length)] }}></div>
                  <span className="stats-label">{label}</span>
                  <span className="stats-count">{values[index]}</span>
                  <span className="stats-percent">
                    {Math.round((values[index] / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
