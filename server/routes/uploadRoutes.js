const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('❌ Error de Multer:', err);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    return res.status(400).json({ 
      error: err.message || 'Error al procesar el archivo',
      code: err.code
    });
  }
  next();
};

// Upload profile image
router.post('/profile', protect, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('📤 Iniciando upload de imagen de perfil');
    console.log('req.file:', req.file ? 'Existe' : 'No existe');
    console.log('req.file keys:', req.file ? Object.keys(req.file) : 'N/A');
    
    if (!req.file) {
      console.log('❌ No se recibió ningún archivo');
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    
    // CloudinaryStorage devuelve secure_url cuando funciona correctamente
    // Verificar primero secure_url, luego url, luego path, y finalmente buffer
    let imageUrl;
    if (req.file.secure_url) {
      console.log('✅ Usando secure_url de CloudinaryStorage:', req.file.secure_url);
      imageUrl = req.file.secure_url;
    } else if (req.file.url) {
      console.log('✅ Usando url de CloudinaryStorage:', req.file.url);
      imageUrl = req.file.url;
    } else if (req.file.path) {
      console.log('✅ Usando path de CloudinaryStorage:', req.file.path);
      imageUrl = req.file.path;
    } else if (req.file.buffer) {
      console.log('📦 Archivo en memoria, subiendo a Cloudinary...');
      // Si está en memoria, subirlo a Cloudinary manualmente
      const { cloudinary } = require('../config/cloudinary');
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'stateview',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) {
              console.error('❌ Error en upload_stream:', error);
              reject(error);
            } else {
              console.log('✅ Imagen subida a Cloudinary:', result.secure_url);
              resolve(result);
            }
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    } else {
      console.log('❌ Formato de archivo no válido. req.file keys:', Object.keys(req.file));
      return res.status(400).json({ error: 'Formato de archivo no válido' });
    }
    
    console.log('✅ URL final de la imagen:', imageUrl);
    res.json({ 
      success: true, 
      url: imageUrl,
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('❌ Error completo al subir imagen:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ 
      error: error.message || error.toString() || 'Error al subir la imagen',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Upload banner image
router.post('/banner', protect, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('📤 Iniciando upload de imagen de banner');
    console.log('req.file:', req.file ? 'Existe' : 'No existe');
    
    if (!req.file) {
      console.log('❌ No se recibió ningún archivo');
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    
    // CloudinaryStorage devuelve secure_url cuando funciona correctamente
    // Verificar primero secure_url, luego url, luego path, y finalmente buffer
    let imageUrl;
    if (req.file.secure_url) {
      console.log('✅ Usando secure_url de CloudinaryStorage:', req.file.secure_url);
      imageUrl = req.file.secure_url;
    } else if (req.file.url) {
      console.log('✅ Usando url de CloudinaryStorage:', req.file.url);
      imageUrl = req.file.url;
    } else if (req.file.path) {
      console.log('✅ Usando path de CloudinaryStorage:', req.file.path);
      imageUrl = req.file.path;
    } else if (req.file.buffer) {
      console.log('📦 Archivo en memoria, subiendo a Cloudinary...');
      // Si está en memoria, subirlo a Cloudinary manualmente
      const { cloudinary } = require('../config/cloudinary');
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'stateview',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) {
              console.error('❌ Error en upload_stream:', error);
              reject(error);
            } else {
              console.log('✅ Imagen subida a Cloudinary:', result.secure_url);
              resolve(result);
            }
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    } else {
      console.log('❌ Formato de archivo no válido. req.file keys:', Object.keys(req.file));
      return res.status(400).json({ error: 'Formato de archivo no válido' });
    }
    
    console.log('✅ URL final de la imagen:', imageUrl);
    res.json({ 
      success: true, 
      url: imageUrl,
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('❌ Error completo al subir imagen:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ 
      error: error.message || error.toString() || 'Error al subir la imagen',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 