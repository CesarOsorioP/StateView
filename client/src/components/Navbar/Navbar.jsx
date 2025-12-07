import NotificacionesNav from '../Notificaciones/NotificacionesNav';

// Dentro del componente Navbar, en la sección de acciones del usuario
<div className="navbar-actions">
  {isAuthenticated ? (
    <>
      <NotificacionesNav />
      // ... existing authenticated user actions ...
    </>
  ) : (
    // ... existing unauthenticated user actions ...
  )}
</div> 