const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dyc3f8aff',
  api_key: '727966489613275',
  api_secret: 'Gmr9pIzWvai1qUD_FGCPHA4V9Ro'
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'stateview',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Create multer upload instance
const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload
}; 