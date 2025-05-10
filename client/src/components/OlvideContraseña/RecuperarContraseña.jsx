import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./RecuperarContraseña.css"; // Crearemos este archivo después
import api from '../../api/api'

const RecuperarContraseña = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        contraseña: "",
        confirmarContraseña: ""
    });
    const [validToken, setValidToken] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            try {
                await api.get(
                    `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/reset-password/${token}`
                );
                setValidToken(true);
            } catch (error) {
                setError("El enlace es inválido o ha expirado");
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (formData.contraseña !== formData.confirmarContraseña) {
            setError("Las contraseñas no coinciden");
            return;
        }
        
        if (formData.contraseña.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        
        setSubmitting(true);
        setError("");
        
        try {
            await api.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/recuperar-contrasena/${token}`,
                { contraseña: formData.contraseña }
            );
            
            setSuccess("Contraseña actualizada correctamente. Redirigiendo...");
            
            // Redireccionar al login después de 3 segundos
            setTimeout(() => {
                navigate("/login");
            }, 3000);
            
        } catch (error) {
            setError(error.response?.data?.error || "Error al actualizar la contraseña");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="reset-password-container">
                <div className="loading-spinner">Verificando enlace...</div>
            </div>
        );
    }

    if (!validToken) {
        return (
            <div className="reset-password-container">
                <div className="error-message">
                    <h2>Enlace inválido</h2>
                    <p>{error}</p>
                    <Link to="/forgot-password" className="link-button">
                        Solicitar un nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <main className="reset-password-main">
                <h1>Establecer nueva contraseña</h1>
                <p className="subtitulo">Por favor, ingresa tu nueva contraseña.</p>
                
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                
                <form onSubmit={handleSubmit} className="reset-form">
                    <div className="input-group">
                        <label htmlFor="contraseña">Nueva contraseña:</label>
                        <input
                            id="contraseña"
                            name="contraseña"
                            type="password"
                            value={formData.contraseña}
                            onChange={handleChange}
                            required
                            disabled={submitting}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmarContraseña">Confirmar contraseña:</label>
                        <input
                            id="confirmarContraseña"
                            name="confirmarContraseña"
                            type="password"
                            value={formData.confirmarContraseña}
                            onChange={handleChange}
                            required
                            disabled={submitting}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="enviar-btn" 
                        disabled={submitting}
                    >
                        {submitting ? "Actualizando..." : "Actualizar contraseña"}
                    </button>
                </form>

                <p className="login-link">
                    ¿Ya recordaste tu contraseña? <Link to="/login">¡Inicia sesión aquí!</Link>
                </p>
            </main>

            <footer className="reset-password-footer">
                <div className="footer-content">
                    <h2>StateView</h2>
                    <p>Visualiza y gestiona tus datos de forma sencilla</p>
                    
                    <div className="quick-links">
                        <Link to="/">Inicio</Link>
                        <Link to="/features">Características</Link>
                        <Link to="/pricing">Precios</Link>
                        <Link to="/contact">Contacto</Link>
                    </div>
                    
                    <p className="copyright">© 2025 StateView - Todos los derechos reservados</p>
                </div>
            </footer>
        </div>
    );
};

export default RecuperarContraseña;