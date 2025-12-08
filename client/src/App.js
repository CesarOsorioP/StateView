// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PersonaProvider } from './context/PersonaContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from "./components/Landing/Navbar";
import Landing from "./pages/LandingPage";
import Login from "./components/Login/Login";
import Signup from "./components/SignUp/SignUp";
import Footer from "./components/Landing/Footer";
import AlbumPage from "./pages/AlbumPage";
import AlbumDetail from "./pages/AlbumDetail";
import VideojuegosPage from "./pages/VideojuegosPage";
import VideojuegosDetail from "./pages/VideojuegosDetail";
import SeriesPage from "./pages/SeriesPage";
import SeriesDetail from "./pages/SeriesDetail";
import PeliculasPage from "./pages/PeliculasPage";
import PeliculaDetail from "./pages/PeliculaDetail";
import OlvideContraseñaPage from "./components/OlvideContraseña/OlvideContraseña";
import RecuperarContraseña from "./components/OlvideContraseña/RecuperarContraseña";
import Listas from "./components/Usuario/MisListas/Listas";
import ListaDetalle from "./components/Usuario/MisListas/ListaDetalle";
import UserDashboard from "./components/Admin/UserDashboard";
import ContentDashboard from "./components/Admin/ContentDashboard";
import UserManagement from "./components/Admin/UserManagement";
import ContentManagement from "./components/Admin/ContentManager";
import PerfilUsuario from "./components/Usuario/PerfilUsuario";
import ReportManagement from "./components/Admin/reportManager";
import GestionarInsignias from "./pages/GestionarInsignias";
import Toast from './components/Toast/Toast';
import SearchResults from './pages/SearchResults';
import NotificacionesList from './components/Notificaciones/NotificacionesList';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/albumes" element={<AlbumPage />} />
        <Route path="/albumes/:albumId" element={<AlbumDetail />} />
        <Route path="/videojuegos" element={<VideojuegosPage />} />
        <Route path="/videojuegos/:gameId" element={<VideojuegosDetail />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/series/:seriesId" element={<SeriesDetail />} />
        <Route path="/peliculas" element={<PeliculasPage />} />
        <Route path="/peliculas/:movieId" element={<PeliculaDetail />} />
        <Route path="/pelicula/:movieId" element={<PeliculaDetail />} />
        <Route path="/serie/:seriesId" element={<SeriesDetail />} />
        <Route path="/album/:albumId" element={<AlbumDetail />} />
        <Route path="/videojuego/:gameId" element={<VideojuegosDetail />} />
        <Route path="/gestionar-usuario" element={<UserManagement />} />
        <Route path="/gestionar-contenido" element={<ContentManagement />} />
        <Route path="/gestionar-reportes" element={<ReportManagement/>} />
        <Route path="/gestionar-insignias" element={<GestionarInsignias user={user} />} />
        <Route path="/olvide-contrasena" element={<OlvideContraseñaPage />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/perfil/:username" element={<PerfilUsuario />} />
        <Route path="/:username" element={<Navigate to="/perfil/:username" replace />} />
        <Route path="/listas" element={<Listas />} />
        <Route path="/listas/:id" element={<ListaDetalle />} />
        <Route path="recuperar-contrasena/:token" element={<RecuperarContraseña />} />
        <Route path="/dashboard/users" element={<UserDashboard />} />
        <Route path="/dashboard/content" element={<ContentDashboard />} />
        <Route path="/busqueda" element={<SearchResults />} />
        <Route path="/notificaciones" element={
          <ProtectedRoute>
            <NotificacionesList />
          </ProtectedRoute>
        } />
        <Route path="404" element={<NotFound />} />
      </Routes>
      <Footer />
      <Toast />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <PersonaProvider>
        <ToastProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ToastProvider>
      </PersonaProvider>
    </AuthProvider>
  );
};

export default App;

