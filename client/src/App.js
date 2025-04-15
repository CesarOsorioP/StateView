// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Landing/Navbar";
import Landing from "./pages/LandingPage";
import Login from "./components/Login/Login";
import Signup from "./components/SignUp/SignUp";
import Footer from "./components/Landing/Footer"
import AlbumPage from "./pages/AlbumPage";
import AlbumDetail from "./pages/AlbumDetail"
// Importa otros componentes según sea necesario

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
          {/* Agrega más rutas según sea necesario */}
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;