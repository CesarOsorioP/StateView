// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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

// Importa el componente de gestión de usuarios (acceso para admin y moderadores)
import UserManagement from "./components/Admin/UserManagement";

const App = () => {
  return (
    <AuthProvider>
      <Router>
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
          {/* Ruta para la gestión de usuarios (acceso restringido a Administradores y Moderadores) */}
          <Route path="/gestionar-usuario" element={<UserManagement />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;

