// src/components/Profile/PerfilUsuario.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import "./PerfilUsuario.css";
import api from "../../api/api";

const PerfilUsuario = () => {
  const { user, updateUserContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  // cacheBuster se actualizará tras cada guardado para forzar la recarga de la imagen
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    imagenPerfil: "",
    imagenBanner: ""
  });

  // Cargar datos del usuario actual del contexto
  useEffect(() => {
    if (user) {
      setUserData(user);
      setFormData({
        nombre: user.nombre || "",
        email: user.email || "",
        contraseña: "",
        imagenPerfil: user.imagenPerfil || "",
        imagenBanner: user.imagenBanner || ""
      });
    }
  }, [user]);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para obtener el ID del usuario
  const getUserId = () => {
    if (!userData) return "";
    return userData._id || userData.id || "";
  };

  // Función que determina si una URL tiene contenido
  const isValidImageUrl = (url) => {
    return url && url.trim() !== "";
  };

  // Guardar cambios en el perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!user) {
        throw new Error("No se ha iniciado sesión");
      }
      const userId = getUserId();
      if (!userId) {
        throw new Error("No se pudo encontrar el ID del usuario");
      }

      const updateData = {
        nombre: formData.nombre,
        email: formData.email,
        imagenPerfil: formData.imagenPerfil,
        imagenBanner: formData.imagenBanner
      };

      // Incluir contraseña solo si se ingresó una nueva
      if (formData.contraseña) {
        updateData.contraseña = formData.contraseña;
      }

      const res = await api.put(`/api/persona/${userId}`, updateData);

      if (!res.data || !res.data.data) {
        throw new Error("Respuesta inválida del servidor");
      }

      const updatedUser = res.data.data;
      setUserData(updatedUser);

      // Actualizar el contexto de autenticación para que la imagen se muestre actualizada en toda la app
      if (updateUserContext) {
        updateUserContext({
          ...user,
          ...updatedUser
        });
      }
      // Actualizar cacheBuster para forzar la recarga de las imágenes
      setCacheBuster(Date.now());
      setSuccess("Perfil actualizado con éxito");
      setIsEditing(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error desconocido";
      setError(`Error actualizando el perfil: ${errorMsg}`);
      console.error("Error al actualizar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  // Habilitar modo edición
  const enableEditMode = () => {
    setIsEditing(true);
  };

  // Cancelar edición y restaurar datos originales
  const cancelEdit = () => {
    if (userData) {
      setFormData({
        nombre: userData.nombre || "",
        email: userData.email || "",
        contraseña: "",
        imagenPerfil: userData.imagenPerfil || "",
        imagenBanner: userData.imagenBanner || ""
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  if (!userData) {
    return (
      <div className="profile-page">
        <div className="loading-block">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-usuario-page">
      {/* Banner */}
      <div className="perfil-banner">
        {isValidImageUrl(userData.imagenBanner) ? (
          <img
            src={`${userData.imagenBanner}?v=${cacheBuster}`}
            alt="Banner del perfil"
            onError={(e) => {
              console.error("Error cargando banner:", e);
              e.target.src =
                "https://via.placeholder.com/800x200.png?text=Banner+por+defecto";
            }}
          />
        ) : (
          <img
            src="https://via.placeholder.com/800x200.png?text=Banner+por+defecto"
            alt="Banner por defecto"
          />
        )}
      </div>

      <div className="page-header">
        <h1>Mi Perfil</h1>
        {!isEditing && (
          <button className="create-button" onClick={enableEditMode}>
            Editar Perfil
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <hr className="gradient-divider" />

      <div className="perfil-container">
        <div className="perfil-imagen">
          {isValidImageUrl(userData.imagenPerfil) ? (
            <img
              src={`${userData.imagenPerfil}?v=${cacheBuster}`}
              alt="Imagen de perfil"
              onError={(e) => {
                console.error("Error cargando imagen de perfil:", e);
                e.target.src =
                  "https://via.placeholder.com/180x180.png?text=Profile";
              }}
            />
          ) : (
            <img
              src="https://via.placeholder.com/180x180.png?text=Profile"
              alt="Imagen de perfil por defecto"
            />
          )}
          <div className="perfil-id">ID: {getUserId()}</div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre:</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contraseña">Contraseña:</label>
              <input
                id="contraseña"
                type="password"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleInputChange}
                placeholder="Deja vacío para no cambiar"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="imagenPerfil">Imagen de Perfil:</label>
              <input
                id="imagenPerfil"
                type="text"
                name="imagenPerfil"
                value={formData.imagenPerfil}
                onChange={handleInputChange}
                placeholder="URL de la imagen de perfil"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="imagenBanner">Imagen del Banner:</label>
              <input
                id="imagenBanner"
                type="text"
                name="imagenBanner"
                value={formData.imagenBanner}
                onChange={handleInputChange}
                placeholder="URL de la imagen del banner"
                className="form-input"
              />
            </div>

            <div className="form-buttons">
              <button
                type="submit"
                className="form-button primary"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="form-button secondary"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="perfil-detalles">
            <div className="detalle-item">
              <h3>Nombre</h3>
              <p>{userData.nombre || "No especificado"}</p>
            </div>

            <div className="detalle-item">
              <h3>Email</h3>
              <p>{userData.email || "No especificado"}</p>
            </div>

            <div className="detalle-item">
              <h3>Rol</h3>
              <p>{userData.rol || "No especificado"}</p>
            </div>

            <div className="detalle-item">
              <h3>ID de Usuario</h3>
              <p>{getUserId()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfilUsuario;
