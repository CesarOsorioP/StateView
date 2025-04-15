import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Signup from "./pages/SignupPage";
import Login from "./pages/LoginPage";
import Navbar from "./components/Landing/Navbar.jsx";
import Footer from "./components/Landing/Footer.jsx"; // Importamos el componente Footer

const App = () => {
  return (
    <Router>
      <div className="app-container"> {/* Agregamos un contenedor para estructurar la página */}
        <Navbar />
        
        <main className="content"> {/* Envolvemos las rutas en un main para mejor estructura */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        
        <Footer /> {/* Agregamos el componente Footer */}
      </div>
    </Router>
  );
};

export default App;