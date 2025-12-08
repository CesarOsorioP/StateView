import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./OlvideContraseña.css";
import api from '../../api/api'

const OlvideContraseñaPage = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState({
        message: "",
        type: ""  // "success" o "error"
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await api.post('/api/auth/olvide-contrasena', { email });
            console.log('Correo enviado:', response.data.message);


            setStatus({
                message: response.data.message,
                type: "success"
            });
            
            // Limpia el campo de email después de enviar con éxito
            setEmail("");
        } catch (error) {
            console.error('Error:', error);
            setStatus({
                message: error.response?.data?.error || "Ocurrió un error al procesar la solicitud",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="olvide-contrasena-container">
            <main className="olvide-contrasena-main">
                <h1>Recuperar contraseña</h1>
                <p className="subtitulo">Ingrese su correo electrónico para restablecer su contraseña.</p>
                
                {status.message && (
                    <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
                        {status.message}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="olvide-form">
                    <div className="input-group">
                        <label htmlFor="email">Correo electrónico:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="eagle@scarpe.com"
                            required
                            disabled={loading}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="enviar-btn" 
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : "Enviar enlace"}
                    </button>
                </form>

                <p className="olvide-login-link">
                    ¿Ya tienes una cuenta? <Link to="/login">¡Inicia sesión aquí!</Link>
                </p>
            </main>
        </div>
    );
};

export default OlvideContraseñaPage;