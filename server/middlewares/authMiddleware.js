// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para proteger rutas verificando el token JWT.
 * Si el token es válido, se adjunta el payload al req como req.user.
 */
const protect = (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ error: 'No autorizado, token no presente' });
    }
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'No autorizado, token no válido' });
  }
};

/**
 * Middleware para restringir el acceso a ciertos roles.
 * Recibe una lista de roles permitidos y verifica si req.user.rol está incluido.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res
        .status(403)
        .json({ error: 'Acceso denegado: No tienes permisos para realizar esta acción' });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
