import React from "react";
import { Link } from "react-router-dom";
import "./OlvideContraseña.css"; // Asegúrate que el nombre del archivo coincida exactamente

const OlvideContraseñaPage = () => {
    const [email, setEmail] = React.useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Lógica para enviar el email
        alert(`Se ha enviado el enlace a: ${email}`);
    };

    return (
        <div className="olvide-contrasena-container">
            <main className="olvide-contrasena-main">
                <h1>Recuperar contraseña</h1>
                <p className="subtitulo">Ingrese su correo electrónico para restablecer su contraseña.</p>
                
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
                        />
                    </div>
                    <button type="submit" className="enviar-btn">Enviar enlace</button>
                </form>

                <p className="login-link">
                    ¿Ya tienes una cuenta? <Link to="/login">¡Inicia sesión aquí!</Link>
                </p>
            </main>

            <footer className="olvide-footer">
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

export default OlvideContraseñaPage;