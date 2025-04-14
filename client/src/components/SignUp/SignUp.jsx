import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/signup", { 
        nombre, 
        email, 
        contraseña 
      });
      setMensaje("Registro exitoso: " + response.data.message);
    } catch (error) {
      const mensajeError = error.response?.data?.error || "Error desconocido al registrarse.";
      setMensaje(mensajeError);
    }
  };

  return (
    <div className="signup-form">
      <h2>Registrarse</h2>
      <form onSubmit={handleSignup}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ingresa tu nombre"
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresa tu correo electrónico"
            required
          />
        </div>
        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            placeholder="Crea una contraseña"
            required
          />
        </div>
        <button type="submit">Registrarse</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default Signup;
