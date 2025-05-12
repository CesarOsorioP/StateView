// src/components/admin/UserDashboard.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Doughnut, Bar, Line, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from "chart.js";
import { io } from "socket.io-client";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserDashboard.css";

// Registrar los componentes necesarios en Chart.js
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  Title, 
  LinearScale, 
  CategoryScale, 
  BarElement, 
  PointElement, 
  LineElement,
  RadialLinearScale
);

// Componentes más pequeños para mejor organización
const ConnectionStatus = ({ isConnected }) => (
  <div className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
    <span className="status-indicator"></span>
    <span className="status-text">
      {isConnected ? "Conectado" : "Desconectado"}
    </span>
  </div>
);

const LastUpdate = ({ lastUpdate, formatDate }) => (
  lastUpdate && (
    <div className="last-update">
      Última actualización: {formatDate(lastUpdate)}
    </div>
  )
);

const StatsItem = ({ label, value }) => (
  <div className="stats-item">
    <span className="stats-label">{label}</span>
    <span className="stats-value">{value}</span>
  </div>
);

const ChartCard = ({ children, summary }) => (
  <div className="chart-card">
    <div className="chart-container">
      {children}
    </div>
    {summary && (
      <div className="chart-summary">
        {summary}
      </div>
    )}
  </div>
);

const UserDashboard = () => {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({});
  const [contentStats, setContentStats] = useState({
    reviews: { Pelicula: 0, Serie: 0, Videojuego: 0, Album: 0 },
    contentCount: { Pelicula: 0, Serie: 0, Videojuego: 0, Album: 0 },
    avgRatings: { Pelicula: 0, Serie: 0, Videojuego: 0, Album: 0 },
    userActivity: Array(7).fill(0) // Actividad de los últimos 7 días
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const prevStatsRef = useRef({});
  const chartRef = useRef(null);

  // Socket.io connection setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("No se encontró token de autenticación");
      return;
    }

    const socket = io("api/dashboard/users", {
      auth: { token }
    });

    socket.on("connect", () => {
      console.log("Conectado al dashboard de usuarios");
      setIsConnected(true);
    });

    socket.on("userStats", (data) => {
      console.log("Estadísticas de usuarios (por Estado):", data);
      
      // Comparar con datos anteriores para determinar cambios significativos
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

    socket.on("contentStats", (data) => {
      console.log("Estadísticas de contenido:", data);
      setContentStats(data);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del dashboard de usuarios");
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Efecto para simular datos en desarrollo
  useEffect(() => {
    // Solo para desarrollo, se reemplazará con datos reales de Socket.io
    const mockContentStats = {
      reviews: { Pelicula: 47, Serie: 32, Videojuego: 23, Album: 18 },
      contentCount: { Pelicula: 25, Serie: 15, Videojuego: 30, Album: 20 },
      avgRatings: { Pelicula: 4.2, Serie: 3.8, Videojuego: 4.5, Album: 4.1 },
      userActivity: [12, 18, 24, 32, 28, 42, 36] // últimos 7 días
    };
    
    setContentStats(mockContentStats);
    
    // Simulamos datos de usuarios para desarrollo
    if (Object.keys(stats).length === 0) {
      setStats({
        "Activo": 124,
        "Inactivo": 45,
        "Pendiente": 22,
        "Suspendido": 8
      });
    }
  }, [stats]);

  // Utilidades
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

  const getDayLabels = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
    }
    return days;
  };

  // Cálculos derivados
  const totalUsers = useMemo(() => 
    Object.values(stats).reduce((acc, curr) => acc + curr, 0),
    [stats]
  );
  
  const totalReviews = useMemo(() => 
    Object.values(contentStats.reviews).reduce((a, b) => a + b, 0),
    [contentStats.reviews]
  );
  
  const totalContent = useMemo(() => 
    Object.values(contentStats.contentCount).reduce((a, b) => a + b, 0),
    [contentStats.contentCount]
  );
  
  const avgRating = useMemo(() => 
    (Object.values(contentStats.avgRatings).reduce((a, b) => a + b, 0) / 4).toFixed(1),
    [contentStats.avgRatings]
  );

  // Componente para mostrar el porcentaje
  const getPercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Componentes para los resúmenes detallados
  const UserStatsSummary = () => {
    return (
      <div className="summary-details">
        <h3>Detalles de Estados de Usuario</h3>
        <ul>
          {Object.entries(stats).map(([status, count]) => (
            <li key={status}>
              <strong>{status}:</strong> {count} usuarios ({getPercentage(count, totalUsers)}%)
            </li>
          ))}
          <li><strong>Total:</strong> {totalUsers} usuarios</li>
        </ul>
      </div>
    );
  };

  const ReviewsStatsSummary = () => {
    return (
      <div className="summary-details">
        <h3>Detalles de Reseñas</h3>
        <ul>
          <li><strong>Películas:</strong> {contentStats.reviews.Pelicula} reseñas ({getPercentage(contentStats.reviews.Pelicula, totalReviews)}%)</li>
          <li><strong>Series:</strong> {contentStats.reviews.Serie} reseñas ({getPercentage(contentStats.reviews.Serie, totalReviews)}%)</li>
          <li><strong>Videojuegos:</strong> {contentStats.reviews.Videojuego} reseñas ({getPercentage(contentStats.reviews.Videojuego, totalReviews)}%)</li>
          <li><strong>Álbumes:</strong> {contentStats.reviews.Album} reseñas ({getPercentage(contentStats.reviews.Album, totalReviews)}%)</li>
          <li><strong>Total:</strong> {totalReviews} reseñas</li>
        </ul>
      </div>
    );
  };

  const ContentStatsSummary = () => {
    return (
      <div className="summary-details">
        <h3>Detalles de Contenido</h3>
        <ul>
          <li><strong>Películas:</strong> {contentStats.contentCount.Pelicula} elementos ({getPercentage(contentStats.contentCount.Pelicula, totalContent)}%)</li>
          <li><strong>Series:</strong> {contentStats.contentCount.Serie} elementos ({getPercentage(contentStats.contentCount.Serie, totalContent)}%)</li>
          <li><strong>Videojuegos:</strong> {contentStats.contentCount.Videojuego} elementos ({getPercentage(contentStats.contentCount.Videojuego, totalContent)}%)</li>
          <li><strong>Álbumes:</strong> {contentStats.contentCount.Album} elementos ({getPercentage(contentStats.contentCount.Album, totalContent)}%)</li>
          <li><strong>Total:</strong> {totalContent} elementos</li>
        </ul>
      </div>
    );
  };

  const ActivityStatsSummary = () => {
    const avgActivity = contentStats.userActivity.reduce((a, b) => a + b, 0) / 7;
    const maxActivity = Math.max(...contentStats.userActivity);
    const dayOfMax = getDayLabels()[contentStats.userActivity.indexOf(maxActivity)];

    return (
      <div className="summary-details">
        <h3>Resumen de Actividad Diaria</h3>
        <ul>
          {getDayLabels().map((day, index) => (
            <li key={day}>
              <strong>{day}:</strong> {contentStats.userActivity[index]} actividades
            </li>
          ))}
          <li><strong>Promedio diario:</strong> {avgActivity.toFixed(1)} actividades</li>
          <li><strong>Día más activo:</strong> {dayOfMax} ({maxActivity} actividades)</li>
        </ul>
      </div>
    );
  };

  const RatingsStatsSummary = () => {
    let bestRated = { type: "", rating: 0 };
    
    Object.entries(contentStats.avgRatings).forEach(([type, rating]) => {
      if (rating > bestRated.rating) {
        bestRated = { 
          type: type === "Pelicula" ? "Películas" :
                type === "Serie" ? "Series" :
                type === "Videojuego" ? "Videojuegos" : "Álbumes",
          rating
        };
      }
    });

    return (
      <div className="summary-details">
        <h3>Detalles de Calificaciones</h3>
        <ul>
          <li><strong>Películas:</strong> {contentStats.avgRatings.Pelicula}/5.0</li>
          <li><strong>Series:</strong> {contentStats.avgRatings.Serie}/5.0</li>
          <li><strong>Videojuegos:</strong> {contentStats.avgRatings.Videojuego}/5.0</li>
          <li><strong>Álbumes:</strong> {contentStats.avgRatings.Album}/5.0</li>
          <li><strong>Promedio global:</strong> {avgRating}/5.0</li>
          <li><strong>Mejor calificado:</strong> {bestRated.type} ({bestRated.rating}/5.0)</li>
        </ul>
      </div>
    );
  };

  // Preparación de datos para charts
  const chartData = useMemo(() => {
    // GRÁFICO 1: Distribución de estados de usuario (Doughnut)
    const userData = {
      labels: Object.keys(stats),
      datasets: [
        {
          label: "Cantidad de Usuarios",
          data: Object.values(stats),
          backgroundColor: [
            "#9d4edd",
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

    // GRÁFICO 2: Reseñas por tipo de contenido (Bar)
    const reviewsData = {
      labels: ["Películas", "Series", "Videojuegos", "Álbumes"],
      datasets: [
        {
          label: "Cantidad de Reseñas",
          data: [
            contentStats.reviews.Pelicula,
            contentStats.reviews.Serie,
            contentStats.reviews.Videojuego,
            contentStats.reviews.Album
          ],
          backgroundColor: [
            "#ff6b6b",
            "#48bfe3",
            "#06d6a0",
            "#ffd166"
          ],
          borderColor: "#121212",
          borderWidth: 1,
        }
      ]
    };

    // GRÁFICO 3: Distribución de tipos de contenido (Doughnut)
    const contentData = {
      labels: ["Películas", "Series", "Videojuegos", "Álbumes"],
      datasets: [
        {
          label: "Cantidad de Contenido",
          data: [
            contentStats.contentCount.Pelicula,
            contentStats.contentCount.Serie,
            contentStats.contentCount.Videojuego,
            contentStats.contentCount.Album
          ],
          backgroundColor: [
            "#f72585",
            "#4cc9f0",
            "#4895ef",
            "#560bad"
          ],
          borderColor: "#121212",
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };

    // GRÁFICO 4: Actividad de usuarios últimos 7 días (Line)
    const activityData = {
      labels: getDayLabels(),
      datasets: [
        {
          label: "Actividad de Usuarios",
          data: contentStats.userActivity,
          borderColor: "#4cc9f0",
          backgroundColor: "rgba(76, 201, 240, 0.2)",
          tension: 0.3,
          fill: true
        }
      ]
    };

    // GRÁFICO 5: Promedio de calificaciones por tipo (Radar)
    const ratingsData = {
      labels: ["Películas", "Series", "Videojuegos", "Álbumes"],
      datasets: [
        {
          label: "Calificación Promedio",
          data: [
            contentStats.avgRatings.Pelicula,
            contentStats.avgRatings.Serie,
            contentStats.avgRatings.Videojuego,
            contentStats.avgRatings.Album
          ],
          backgroundColor: "rgba(102, 126, 234, 0.2)",
          borderColor: "#667eea",
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#667eea"
        }
      ]
    };

    return { userData, reviewsData, contentData, activityData, ratingsData };
  }, [stats, contentStats]);

  // Opciones de charts
  const chartOptions = useMemo(() => {
    // Opciones comunes para todas las gráficas
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            color: "#e0e0e0",
            font: { size: 14 },
            padding: 20
          }
        }
      },
      animation: {
        duration: 500
      }
    };

    // Opciones específicas para cada tipo de gráfica
    return {
      user: {
        ...commonOptions,
        cutout: '65%',
        plugins: {
          ...commonOptions.plugins,
          title: { 
            display: true, 
            text: 'Distribución de Estados de Usuarios',
            color: "#e0e0e0",
            font: { size: 18, weight: 'bold' },
            padding: 20
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const percentage = Math.round((value / totalUsers) * 100);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      },
      reviews: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: { 
            display: true, 
            text: 'Reseñas por Tipo de Contenido',
            color: "#e0e0e0",
            font: { size: 18, weight: 'bold' },
            padding: 20
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#e0e0e0" }
          },
          x: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#e0e0e0" }
          }
        }
      },
      content: {
        ...commonOptions,
        cutout: '65%',
        plugins: {
          ...commonOptions.plugins,
          title: { 
            display: true, 
            text: 'Distribución de Tipos de Contenido',
            color: "#e0e0e0",
            font: { size: 18, weight: 'bold' },
            padding: 20
          }
        }
      },
      activity: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: { 
            display: true, 
            text: 'Actividad de Usuarios (Últimos 7 días)',
            color: "#e0e0e0",
            font: { size: 18, weight: 'bold' },
            padding: 20
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#e0e0e0" }
          },
          x: {
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            ticks: { color: "#e0e0e0" }
          }
        }
      },
      ratings: {
        ...commonOptions,
        scales: {
          r: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
              backdropColor: 'transparent',
              color: "#e0e0e0"
            },
            grid: { color: "rgba(255, 255, 255, 0.3)" },
            angleLines: { color: "rgba(255, 255, 255, 0.3)" },
            pointLabels: {
              color: "#e0e0e0",
              font: { size: 14 }
            }
          }
        },
        plugins: {
          ...commonOptions.plugins,
          title: { 
            display: true, 
            text: 'Calificación Promedio por Tipo',
            color: "#e0e0e0",
            font: { size: 18, weight: 'bold' },
            padding: 20
          }
        }
      }
    };
  }, [totalUsers]);

  // Control de acceso
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Panel de Control de Contenido</h1>
        <div className="user-info">
          <span className="user-name">{user?.nombre || "Usuario"}</span>
          <span className="user-role">{user?.rol || "Sin rol"}</span>
        </div>
      </header>

      <div className="dashboard-status">
        <ConnectionStatus isConnected={isConnected} />
        <LastUpdate lastUpdate={lastUpdate} formatDate={formatDate} />
      </div>

      <div className="dashboard-grid">
        {/* Gráfico 1: Estados de Usuario */}
        <ChartCard summary={<UserStatsSummary />}>
          <Doughnut 
            ref={chartRef}
            data={chartData.userData} 
            options={chartOptions.user} 
          />
        </ChartCard>

        {/* Gráfico 2: Reseñas por Tipo de Contenido */}
        <ChartCard summary={<ReviewsStatsSummary />}>
          <Bar
            data={chartData.reviewsData}
            options={chartOptions.reviews}
          />
        </ChartCard>

        {/* Gráfico 3: Distribución de Tipos de Contenido */}
        <ChartCard summary={<ContentStatsSummary />}>
          <Doughnut
            data={chartData.contentData}
            options={chartOptions.content}
          />
        </ChartCard>

        {/* Gráfico 4: Timeline de Actividad */}
        <ChartCard summary={<ActivityStatsSummary />}>
          <Line
            data={chartData.activityData}
            options={chartOptions.activity}
          />
        </ChartCard>

        {/* Gráfico 5: Calificaciones Promedio */}
        <ChartCard summary={<RatingsStatsSummary />}>
          <Radar
            data={chartData.ratingsData}
            options={chartOptions.ratings}
          />
        </ChartCard>

        {/* Panel de Estadísticas Generales */}
        <div className="stats-card">
          <div className="stats-header">
            <h2>Resumen General</h2>
            {isConnected && (
              <div className="pulse-indicator" title="Actualizaciones en tiempo real activas"></div>
            )}
          </div>
          <div className="stats-content">
            <div className="stats-summary">
              <StatsItem label="Total de Usuarios" value={totalUsers} />
              <StatsItem label="Total de Reseñas" value={totalReviews} />
              <StatsItem label="Total de Contenido" value={totalContent} />
              <StatsItem label="Calificación Promedio Global" value={avgRating} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;