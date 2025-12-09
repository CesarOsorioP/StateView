const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Intentar importar CloudinaryStorage de diferentes formas según la versión
let CloudinaryStorage;
try {
  const multerStorageCloudinary = require('multer-storage-cloudinary');
  
  // Intentar diferentes formas de importación
  if (typeof multerStorageCloudinary === 'function') {
    // Es una clase exportada por defecto
    CloudinaryStorage = multerStorageCloudinary;
  } else if (multerStorageCloudinary && typeof multerStorageCloudinary.CloudinaryStorage === 'function') {
    // Está en una propiedad nombrada
    CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage;
  } else if (multerStorageCloudinary && typeof multerStorageCloudinary.default === 'function') {
    // Está en default
    CloudinaryStorage = multerStorageCloudinary.default;
  } else {
    // Último intento: puede que sea un objeto con la clase dentro
    const keys = Object.keys(multerStorageCloudinary || {});
    console.log('Debug - Keys disponibles:', keys);
    throw new Error(`No se pudo encontrar CloudinaryStorage. Keys disponibles: ${keys.join(', ')}`);
  }
  
  if (typeof CloudinaryStorage !== 'function') {
    throw new Error('CloudinaryStorage no es un constructor (tipo: ' + typeof CloudinaryStorage + ')');
  }
} catch (error) {
  console.error('❌ Error importando multer-storage-cloudinary:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dyc3f8aff',
  api_key: '727966489613275',
  api_secret: 'Gmr9pIzWvai1qUD_FGCPHA4V9Ro'
});

// Configure storage
let storage;
try {
  if (typeof CloudinaryStorage !== 'function') {
    throw new Error('CloudinaryStorage no es un constructor');
  }
  
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'stateview',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
  });
  
  console.log('✅ CloudinaryStorage creado correctamente');
} catch (error) {
  console.error('❌ Error creando CloudinaryStorage:', error.message);
  console.error('Stack:', error.stack);
  // Fallback a almacenamiento en memoria si falla
  storage = multer.memoryStorage();
  console.warn('⚠️  Usando almacenamiento en memoria como fallback');
}

// Create multer upload instance
const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload
}; 