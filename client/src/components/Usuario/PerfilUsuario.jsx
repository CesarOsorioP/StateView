// src/components/Profile/PerfilUsuario.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import "./PerfilUsuario.css";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { usePersona } from '../../context/PersonaContext';
import { useToast } from '../../context/ToastContext';
import { FaUser, FaEdit, FaHeart, FaEye, FaComment, FaAward } from 'react-icons/fa';

// Constantes
const CONTENT_TYPE_PATHS = {
  'pelicula': 'peliculas',
  'album': 'albumes',
  'serie': 'series',
  'videojuego': 'videojuegos',
  'Pelicula': 'peliculas',
  'Serie': 'series',
  'Videojuego': 'videojuegos',
  'Album': 'albumes'
};

const DEFAULT_IMAGES = {
  profile: "https://placehold.co/180x180/1a1a1a/ffffff?text=Profile",
  banner: "https://placehold.co/800x200/1a1a1a/ffffff?text=Banner+por+defecto",
  content: "https://placehold.co/100x150/1a1a1a/ffffff?text=No+Image",
  user: "https://placehold.co/100x100/1a1a1a/ffffff?text=User"
};

const ITEMS_PER_PAGE = {
  reviews: 8,
  comments: 8,
  likes: 12,
  visto_escuchado: 12,
  insignias: 12
};

// Funciones auxiliares
const getSafeValue = (obj, keys, defaultValue = "") => {
  if (!obj) return defaultValue;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return defaultValue;
};

const getSafeUserName = (user) => {
  return getSafeValue(user, ['username', 'nombre', 'nombre_seguidor', 'nombre_persona_seguida'], "Usuario");
};
const getSafeUserId = (user) => getSafeValue(user, ['_id', 'id', 'id_seguidor', 'id_persona_seguida']);
const getSafeUserRole = (user) => getSafeValue(user, ['rol'], "Usuario");

const getSafeCount = (user, keys) => {
  if (!user) return 0;
  for (const key of keys) {
    if (user[key] !== undefined) {
      return Array.isArray(user[key]) ? user[key].length : Number(user[key]) || 0;
    }
  }
  return 0;
};

const getContentPath = (tipo) => {
  if (!tipo) return '';
  return CONTENT_TYPE_PATHS[tipo] || CONTENT_TYPE_PATHS[tipo.toLowerCase()] || tipo.toLowerCase();
};

const formatDate = (dateString) => {
  try {
    console.log('Formatting date string:', dateString);
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date created from:', dateString);
      return 'Fecha inválida';
    }
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Error in formatDate:', e, 'for string:', dateString);
    return 'Fecha inválida';
  }
};

// Custom Hook para manejo de API
const useApi = () => {
  const makeRequest = useCallback(async (method, url, data = null) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        method,
        ...(data && { data })
      };
      
      return await api.request({ url, ...config });
    } catch (err) {
      console.error(`API Error [${method} ${url}]:`, err);
      throw err;
    }
  }, []);

  return { makeRequest };
};

// Custom Hook para paginación
const usePagination = (items, itemsPerPage, activeTab) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  
  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);
  
  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage
  };
};

// Componentes auxiliares
const LoadingSpinner = React.memo(() => (
  <div className="loading-block">
    <div className="loading-spinner"></div>
  </div>
));

const ErrorMessage = React.memo(({ message, onClose }) => (
  <div className="error-message">
    {message}
    {onClose && (
      <button onClick={onClose} className="close-btn">&times;</button>
    )}
  </div>
));

const SuccessMessage = React.memo(({ message, onClose }) => (
  <div className="success-message">
    {message}
    {onClose && (
      <button onClick={onClose} className="close-btn">&times;</button>
    )}
  </div>
));

const UserCard = React.memo(({ user, cacheBuster }) => {
  const userId = getSafeUserId(user);
  const userName = getSafeUserName(user);
  let userImg = user.imagenPerfil || user.imagen || DEFAULT_IMAGES.user;
  
  if (userImg && cacheBuster) {
    userImg += (userImg.includes('?') ? '&' : '?') + 'v=' + cacheBuster;
  }
  
  if (!userId || !userName) return null;
  
  return (
    <div className="user-card">
      <img
        src={userImg}
        alt={userName}
        className="user-avatar"
        loading="lazy"
        onError={e => { e.target.src = DEFAULT_IMAGES.user; }}
      />
      <h3>{userName}</h3>
      <Link to={`/perfil/${userName}`} className="view-profile-btn">
        Ver perfil
      </Link>
    </div>
  );
});

const StarRating = React.memo(({ rating, maxStars = 5 }) => (
  <div className="review-rating">
    {[...Array(maxStars)].map((_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ★
      </span>
    ))}
  </div>
));

const Pagination = React.memo(({ currentPage, totalPages, onPageChange, onNext, onPrev }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination">
      <button 
        onClick={onPrev} 
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        &lt;
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          className={currentPage === i + 1 ? 'active' : ''}
          onClick={() => onPageChange(i + 1)}
          aria-label={`Página ${i + 1}`}
        >
          {i + 1}
        </button>
      ))}
      <button 
        onClick={onNext} 
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
      >
        &gt;
      </button>
    </div>
  );
});

const LikedWatchedCard = React.memo(({ item }) => {
  const content = item.contenido_id || item;
  const title = content.titulo || content.nombre || 'Título no disponible';
  const image = content.imagen || content.poster || content.portada || DEFAULT_IMAGES.content;
  const description = content.sinopsis || content.descripcion || 'Sin descripción';
  const rating = 0; // No rating for liked/watched items directly
  const interactionDate = item.fecha; // Date of interaction (like/watched)
  const totalLikes = 0; // No 'likes' count on the interaction itself, use 0 for style consistency

  return (
    <div className="review-card"> {/* Using review-card styling for consistency */}
      <div className="reviewed-content">
        <div className="reviewed-content-image">
          <img 
            src={image} 
            alt={title} 
            onError={e => { e.target.src = DEFAULT_IMAGES.content; }}
          />
        </div>
        <div className="reviewed-content-info">
          <h4>
            <Link 
              to={`/${getContentPath(item.tipo || content.tipo)}/${content._id || content.juego_id || content.album_id || content.pelicula_id || content.serie_id}`} 
              className="content-title-link"
            >
              {title}
            </Link>
          </h4>
          <StarRating rating={rating} />
          <p className="review-text">{description}</p>
        </div>
      </div>
      <div className="review-footer">
        <span className="review-date">{formatDate(interactionDate)}</span>
        <span className="review-likes">{totalLikes} me gusta</span>
      </div>
    </div>
  );
});

const ReviewCard = React.memo(({ review }) => (
  <div className="review-card">
    <div className="reviewed-content">
      <div className="reviewed-content-image">
        <img 
          src={review.contenido_imagen || DEFAULT_IMAGES.content} 
          alt={review.contenido_titulo} 
          onError={e => { e.target.src = DEFAULT_IMAGES.content; }}
        />
      </div>
      <div className="reviewed-content-info">
        <h4>
          <Link 
            to={`/${getContentPath(review.tipo)}/${review.contenido_id}`} 
            className="content-title-link"
          >
            {review.contenido_titulo}
          </Link>
        </h4>
        <StarRating rating={review.calificacion} />
        <p className="review-text">{review.contenido}</p>
      </div>
    </div>
    <div className="review-footer">
      <span className="review-date">{formatDate(review.fecha)}</span>
      <span className="review-likes">{review.likes || 0} me gusta</span>
    </div>
  </div>
));

const CommentCard = React.memo(({ comment }) => (
  <div className="comment-card">
    <div className="commented-content">
      <div className="commented-content-image">
        <img 
          src={comment.contenido_imagen || DEFAULT_IMAGES.content} 
          alt={comment.contenido_titulo} 
          onError={e => { e.target.src = DEFAULT_IMAGES.content; }}
        />
      </div>
      <div className="commented-content-info">
        <h4>
          <Link 
            to={`/${getContentPath(comment.tipo)}/${comment.contenido_id}`} 
            className="content-title-link"
          >
            {comment.contenido_titulo}
          </Link>
        </h4>
        <StarRating rating={comment.calificacion || 0} />
        <p className="comment-text">{comment.contenido}</p>
      </div>
    </div>
    <div className="comment-footer">
      <span className="comment-date">{formatDate(comment.fecha)}</span>
      <span className="comment-likes">{comment.likes || 0} me gusta</span>
    </div>
  </div>
));

const InsigniaCard = React.memo(({ insignia }) => {
  return (
    <div className="insignia-card">
      <img
        src={insignia.imagen || DEFAULT_IMAGES.content}
        alt={insignia.nombre_insignia || 'Insignia'}
        className="insignia-image"
        onError={e => { e.target.src = DEFAULT_IMAGES.content; }}
      />
      <h3>{insignia.nombre_insignia || 'Nombre no disponible'}</h3>
      <p>Obtenida: {formatDate(insignia.fecha_otorgada)}</p>
    </div>
  );
});

const PerfilUsuario = () => {
  const { user, updateUserContext } = useAuth();
  const { username } = useParams();
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Estados principales
  const [ui, setUi] = useState({
    loading: false,
    error: "",
    success: "",
    isEditing: false,
    activeTab: 'likes',
    loadingTab: false
  });

  const [userData, setUserData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tabData, setTabData] = useState({
    followers: [],
    following: [],
    reviews: [],
    comments: [],
    likes: [],
    visto_escuchado: [],
    insignias: []
  });

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    imagenPerfil: "",
    imagenBanner: "",
    descripcion: ""
  });

  // Paginación
  const reviewPagination = usePagination(tabData.reviews, ITEMS_PER_PAGE.reviews, ui.activeTab);
  const commentPagination = usePagination(tabData.comments, ITEMS_PER_PAGE.comments, ui.activeTab);
  const likesPagination = usePagination(tabData.likes, ITEMS_PER_PAGE.likes, ui.activeTab);
  const vistoEscuchadoPagination = usePagination(tabData.visto_escuchado, ITEMS_PER_PAGE.visto_escuchado, ui.activeTab);
  const insigniaPagination = usePagination(tabData.insignias, ITEMS_PER_PAGE.insignias, ui.activeTab);

  // Valores computados
  const cacheBuster = useMemo(
    () => Date.now() + (userData?.imagenPerfil || '') + (userData?.imagenBanner || '') + (userData?._id || ''),
    [userData?.imagenPerfil, userData?.imagenBanner, userData?._id]
  );

  const userStats = useMemo(() => ({
    followers: getSafeCount(userData, ['seguidores']),
    following: getSafeCount(userData, ['siguiendo']),
    insignias: getSafeCount(userData, ['insignias'])
  }), [userData]);

  const getImageUrl = useCallback((url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    if (url.startsWith('data:')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${cacheBuster}`;
  }, [cacheBuster]);

  // Función para actualizar UI
  const updateUi = useCallback((updates) => {
    setUi(prev => ({ ...prev, ...updates }));
  }, []);

  const clearMessages = useCallback(() => {
    updateUi({ error: "", success: "" });
  }, [updateUi]);

  // API calls principales
  const fetchUserData = async () => {
    try {
      updateUi({ loading: true, error: "" });
      
      const endpoint = username ? `/api/profile/${username}` : `/api/persona/${user._id}`;
      const response = await makeRequest('GET', endpoint);
      const userData = response.data.data;

      if (!userData) {
        throw new Error('No se encontraron datos del usuario');
      }

      setUserData(userData);
      setIsOwnProfile(user && user._id === userData._id);

      // Inicializar formulario
      setFormData({
        nombre: userData.nombre || '',
        email: userData.email || '',
        imagenPerfil: userData.imagenPerfil || '',
        imagenBanner: userData.imagenBanner || '',
        descripcion: userData.descripcion || ''
      });

      // Verificar estado de seguimiento
      if (user && user._id !== userData._id) {
        try {
          const followResponse = await makeRequest('GET', `/api/follow/users/${userData._id}/follow-status`);
          setIsFollowing(followResponse.data.isFollowing);
        } catch (error) {
          console.error('Error al verificar estado de seguimiento:', error);
          setIsFollowing(false); // Default to not following if there's an error
        }
      }

      await loadTabData(ui.activeTab);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      updateUi({ error: error.message });
    } finally {
      updateUi({ loading: false });
    }
  };

  // Carga de datos por tab
  const loadTabData = useCallback(async (tab) => {
    if (!userData?._id) return;
    
    updateUi({ loadingTab: true });
    try {
      let response;
      switch (tab) {
        case 'followers':
          response = await makeRequest('GET', `/api/follow/users/${userData._id}/seguidores`);
          setTabData(prev => ({ ...prev, followers: response.data.seguidores || [] }));
          break;
        case 'following':
          response = await makeRequest('GET', `/api/follow/users/${userData._id}/siguiendo`);
          setTabData(prev => ({ ...prev, following: response.data.siguiendo || [] }));
          break;
        case 'reviews':
          response = await makeRequest('GET', `/api/user-content/${userData._id}/resenas?limit=20`);
          setTabData(prev => ({ ...prev, reviews: response.data.reseñas || [] }));
          break;
        case 'comments':
          response = await makeRequest('GET', `/api/user-content/${userData._id}/comentarios?limit=20`);
          setTabData(prev => ({ ...prev, comments: response.data.comentarios || [] }));
          break;
        case 'likes':
          response = await makeRequest('GET', `/api/persona/${userData._id}/megusta?limit=20&populate=true`);
          setTabData(prev => ({ ...prev, likes: response.data.data || [] }));
          break;
        case 'visto_escuchado':
          response = await makeRequest('GET', `/api/persona/${userData._id}/historial?limit=20&populate=true`);
          setTabData(prev => ({ ...prev, visto_escuchado: response.data.data || [] }));
          break;
        case 'insignias':
          response = await makeRequest('GET', `/api/insignias/usuario/${userData._id}`);
          setTabData(prev => ({ ...prev, insignias: response.data.insignias || [] }));
          break;
      }
    } catch (error) {
      console.error(`Error al cargar ${tab}:`, error);
      updateUi({ error: `Error al cargar ${tab}` });
    } finally {
      updateUi({ loadingTab: false });
    }
  }, [userData?._id, updateUi, makeRequest]);

  // Manejadores de eventos
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFollowToggle = useCallback(async () => {
    if (!user) {
      updateUi({ error: "Debes iniciar sesión para seguir usuarios" });
      return;
    }

    if (user._id === userData._id) {
      updateUi({ error: "No puedes seguirte a ti mismo" });
      return;
    }

    try {
      const endpoint = `/api/follow/users/${userData._id}/${isFollowing ? 'unfollow' : 'follow'}`;
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await makeRequest(method, endpoint);
      
      if (response.data.success) {
        setIsFollowing(!isFollowing);
        setUserData(prev => ({
          ...prev,
          seguidores: response.data.seguidores || (isFollowing ? Math.max(0, prev.seguidores - 1) : prev.seguidores + 1)
        }));
        
        updateUi({ success: `${isFollowing ? 'Dejaste de seguir' : 'Ahora sigues'} a ${getSafeUserName(userData)}` });
      } else {
        throw new Error(response.data.error || 'Error al actualizar el seguimiento');
      }
    } catch (err) {
      console.error('Error en handleFollowToggle:', err);
      // If the error is because we already follow/unfollow, update the UI accordingly
      if (err.response?.data?.error?.includes('Ya sigues a este usuario')) {
        setIsFollowing(true);
        updateUi({ success: 'Ya sigues a este usuario' });
      } else if (err.response?.data?.error?.includes('No sigues a este usuario')) {
        setIsFollowing(false);
        updateUi({ success: 'No sigues a este usuario' });
      } else {
        updateUi({ error: err.message || 'Error al actualizar el seguimiento' });
      }
    }
  }, [user, isFollowing, userData, updateUi, makeRequest]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    updateUi({ loading: true, error: "", success: "" });

    try {
      if (!user || !isOwnProfile) {
        throw new Error("No tienes permiso para editar este perfil");
      }

      const updateData = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        imagenPerfil: formData.imagenPerfil.trim(),
        imagenBanner: formData.imagenBanner.trim(),
        descripcion: formData.descripcion.trim()
      };

      const res = await makeRequest('PUT', `/api/persona/${userData._id}`, updateData);
      const updatedUser = res.data?.data;
      
      setUserData(updatedUser);

      if (updateUserContext) {
        updateUserContext(updatedUser);
        localStorage.setItem('userData', JSON.stringify({ ...user, ...updatedUser }));
      }
      
      updateUi({ success: "Perfil actualizado con éxito", isEditing: false });
    } catch (err) {
      updateUi({ error: `Error actualizando el perfil: ${err.message}` });
    } finally {
      updateUi({ loading: false });
    }
  }, [user, isOwnProfile, userData, formData, updateUserContext, updateUi, makeRequest]);

  const handleTabChange = useCallback((tab) => {
    updateUi({ activeTab: tab, error: "", success: "" });
  }, [updateUi]);

  const handleFileUpload = useCallback(async (file, type) => {
    if (!file) return;

    try {
      updateUi({ loading: true, error: "" });
      
      const formData = new FormData();
      formData.append('image', file); // El backend espera 'image', no 'file'
      
      // Usar la ruta correcta según el tipo de imagen
      const endpoint = type === 'profile' ? '/api/upload/profile' : '/api/upload/banner';
      const response = await makeRequest('POST', endpoint, formData);
      
      if (response.data.url) {
        const fieldName = type === 'profile' ? 'imagenPerfil' : 'imagenBanner';
        
        // Actualizar formData para el formulario
        setFormData(prev => ({
          ...prev,
          [fieldName]: response.data.url
        }));
        
        // Actualizar userData para que se refleje inmediatamente en la UI
        setUserData(prev => {
          const updated = {
          ...prev,
          [fieldName]: response.data.url
          };
          
          // Guardar automáticamente en el backend usando el userData actualizado
          if (updated._id) {
            const updateData = { [fieldName]: response.data.url };
            makeRequest('PUT', `/api/persona/${updated._id}`, updateData)
              .then(() => {
                // Actualizar contexto global
                if (updateUserContext && user) {
                  const updatedContextUser = { ...user, ...updated };
                  updateUserContext(updatedContextUser);
                  localStorage.setItem('userData', JSON.stringify(updatedContextUser));
                }
                updateUi({ success: 'Imagen actualizada correctamente' });
              })
              .catch((saveError) => {
                console.error('Error al guardar automáticamente la imagen:', saveError);
                updateUi({ error: 'Imagen subida pero error al guardar en perfil. Intenta "Guardar cambios".' });
              });
          }
          
          return updated;
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      updateUi({ error: 'Error al subir la imagen' });
    } finally {
      updateUi({ loading: false });
    }
  }, [makeRequest, updateUi, updateUserContext, user]);

  // Effects
  useEffect(() => {
    if (username || (user && user._id)) {
      fetchUserData();
    }
  }, [username, user?._id]);

  useEffect(() => {
    if (userData?._id) {
      loadTabData(ui.activeTab);
    }
  }, [ui.activeTab, userData?._id, loadTabData]);

  useEffect(() => {
    if (ui.error || ui.success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [ui.error, ui.success, clearMessages]);

  // Renderizado condicional
  if (ui.loading && !userData) {
    return (
      <div className="profile-page">
        <LoadingSpinner />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-page">
        <ErrorMessage message="No se pudo cargar el perfil del usuario" />
      </div>
    );
  }

  return (
    <div className="perfil-usuario-page">
      {/* Banner del perfil */}
      <div className="perfil-banner">
        <img 
          src={getImageUrl(userData.imagenBanner) || DEFAULT_IMAGES.banner} 
          alt="Banner de perfil" 
        />
        <div className="banner-overlay" />
      </div>

      {/* Avatar flotante */}
      <div className="profile-avatar-floating">
        <img 
          src={getImageUrl(userData.imagenPerfil) || DEFAULT_IMAGES.profile} 
          alt="Foto de perfil" 
        />
      </div>

      {/* Información principal */}
      <div className="profile-main-info">
        <h1 className="profile-username">{getSafeUserName(userData)}</h1>
        <p className="user-role">{getSafeUserRole(userData)}</p>
        <div className="user-description-container">
          <p className="user-description">{userData.descripcion || 'Sin biografía'}</p>
        </div>
      </div>

      {/* Acciones y estadísticas */}
      <div className="profile-actions">
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{userStats.followers}</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userStats.following}</span>
            <span className="stat-label">Siguiendo</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userStats.insignias}</span>
            <span className="stat-label">Insignias</span>
          </div>
        </div>

        <div className="profile-action-buttons">
          {!isOwnProfile && (
            <button 
              className={`follow-button ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
            >
              {isFollowing ? 'Dejar de seguir' : 'Seguir'}
            </button>
          )}
          {isOwnProfile && (
            <button 
              className="edit-profile-btn"
              onClick={() => updateUi({ isEditing: !ui.isEditing })}
            >
              <FaEdit /> {ui.isEditing ? 'Cancelar' : 'Editar Perfil'}
            </button>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${ui.activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => handleTabChange('likes')}
        >
          <FaHeart /> Me gusta
        </button>
        <button 
          className={`tab-button ${ui.activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => handleTabChange('followers')}
        >
          <FaUser /> Seguidores
        </button>
        <button 
          className={`tab-button ${ui.activeTab === 'following' ? 'active' : ''}`}
          onClick={() => handleTabChange('following')}
        >
          <FaUser /> Siguiendo
        </button>
        <button 
          className={`tab-button ${ui.activeTab === 'visto_escuchado' ? 'active' : ''}`}
          onClick={() => handleTabChange('visto_escuchado')}
        >
          <FaEye /> Visto / Escuchado
        </button>
        <button 
          className={`tab-button ${ui.activeTab === 'insignias' ? 'active' : ''}`}
          onClick={() => handleTabChange('insignias')}
        >
          <FaAward /> Insignias
        </button>
        <button 
          className={`tab-button ${ui.activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => handleTabChange('reviews')}
        >
          <FaEdit /> Reseñas
        </button>
        <button 
          className={`tab-button ${ui.activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => handleTabChange('comments')}
        >
          <FaComment /> Comentarios
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="tab-content">
        {ui.loadingTab ? (
          <LoadingSpinner />
        ) : (
          <>
            {ui.activeTab === 'likes' && (
              <div className="reviews-grid"> {/* Changed to reviews-grid for consistent styling */}
                {likesPagination.paginatedItems.map((item, index) => (
                  <LikedWatchedCard key={item._id || `like-${index}`} item={item} />
                ))}
                <Pagination
                  currentPage={likesPagination.currentPage}
                  totalPages={likesPagination.totalPages}
                  onPageChange={likesPagination.goToPage}
                  onNext={likesPagination.nextPage}
                  onPrev={likesPagination.prevPage}
                />
              </div>
            )}

            {ui.activeTab === 'followers' && (
              <div className="content-grid">
                {tabData.followers.map((user, index) => (
                  <UserCard key={user._id || `follower-${index}`} user={user} cacheBuster={cacheBuster} />
                ))}
              </div>
            )}

            {ui.activeTab === 'following' && (
              <div className="content-grid">
                {tabData.following.map((user, index) => (
                  <UserCard key={user._id || `following-${index}`} user={user} cacheBuster={cacheBuster} />
                ))}
              </div>
            )}

            {ui.activeTab === 'reviews' && (
              <div className="reviews-grid">
                {reviewPagination.paginatedItems.map((review, index) => (
                  <ReviewCard key={review._id || `review-${index}`} review={review} />
                ))}
                <Pagination
                  currentPage={reviewPagination.currentPage}
                  totalPages={reviewPagination.totalPages}
                  onPageChange={reviewPagination.goToPage}
                  onNext={reviewPagination.nextPage}
                  onPrev={reviewPagination.prevPage}
                />
              </div>
            )}

            {ui.activeTab === 'comments' && (
              <div className="comments-grid">
                {commentPagination.paginatedItems.map((comment, index) => (
                  <CommentCard key={comment._id || `comment-${index}`} comment={comment} />
                ))}
                <Pagination
                  currentPage={commentPagination.currentPage}
                  totalPages={commentPagination.totalPages}
                  onPageChange={commentPagination.goToPage}
                  onNext={commentPagination.nextPage}
                  onPrev={commentPagination.prevPage}
                />
              </div>
            )}

            {ui.activeTab === 'visto_escuchado' && (
              <div className="reviews-grid"> {/* Changed to reviews-grid for consistent styling */}
                {vistoEscuchadoPagination.paginatedItems.map((item, index) => (
                  <LikedWatchedCard key={item._id || `visto-${index}`} item={item} />
                ))}
                <Pagination
                  currentPage={vistoEscuchadoPagination.currentPage}
                  totalPages={vistoEscuchadoPagination.totalPages}
                  onPageChange={vistoEscuchadoPagination.goToPage}
                  onNext={vistoEscuchadoPagination.nextPage}
                  onPrev={vistoEscuchadoPagination.prevPage}
                />
              </div>
            )}

            {ui.activeTab === 'insignias' && (
              <div className="content-grid">
                {insigniaPagination.paginatedItems.map((insignia, index) => (
                  <InsigniaCard key={insignia.insignia_id || `insignia-${index}`} insignia={insignia} />
                ))}
                <Pagination
                  currentPage={insigniaPagination.currentPage}
                  totalPages={insigniaPagination.totalPages}
                  onPageChange={insigniaPagination.goToPage}
                  onNext={insigniaPagination.nextPage}
                  onPrev={insigniaPagination.prevPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mensajes de error y éxito */}
      {ui.error && <ErrorMessage message={ui.error} onClose={clearMessages} />}
      {ui.success && <SuccessMessage message={ui.success} onClose={clearMessages} />}

      {/* Modal de edición de perfil */}
      {ui.isEditing && (
        <div className="edit-profile-modal">
          <div className="user-form">
            <h2>Editar Perfil</h2>
            <div className="form-group">
              <label htmlFor="nombre">Nombre de usuario</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Tu nombre de usuario"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Tu correo electrónico"
              />
            </div>
            <div className="form-group">
              <label htmlFor="descripcion">Biografía</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Cuéntanos sobre ti"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Imagen de perfil</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0], 'profile')}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Banner de perfil</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0], 'banner')}
                className="form-input"
              />
            </div>
            <div className="form-buttons">
              <button 
                className="form-button primary"
                onClick={handleSubmit}
                disabled={ui.isSubmitting}
              >
                {ui.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button 
                className="form-button secondary"
                onClick={() => updateUi({ isEditing: false })}
                disabled={ui.isSubmitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilUsuario;