const Insignia = require('../models/Insignia');
const Persona = require('../models/Persona');
const { cloudinary } = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Crear una nueva insignia
async function crearInsignia(req, res) {
  try {
    console.log('BODY:', req.body);
    console.log('FILE:', req.file);

    const { nombre, descripcion } = req.body;
    const imagen = req.file;

    if (!nombre || !descripcion || !imagen) {
      console.log('❌ Faltan datos requeridos');
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Subir imagen a Cloudinary
    console.log('Subiendo imagen a Cloudinary...');
    const result = await cloudinary.uploader.upload(imagen.path, {
      folder: 'insignias',
      resource_type: 'auto'
    });
    console.log('Imagen subida:', result.secure_url);

    const insignia = new Insignia({
      nombre,
      descripcion,
      imagen: result.secure_url
    });

    await insignia.save();
    console.log('Insignia guardada en la base de datos');
    res.status(201).json({ data: insignia });
  } catch (error) {
    console.error('Error en crearInsignia:', error);
    res.status(500).json({ error: error.message });
  }
}

// Listar todas las insignias
async function listarInsignias(req, res) {
  try {
    const insignias = await Insignia.find().populate('usuarios', 'nombre email');
    res.json({ data: insignias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Asignar insignia a un usuario
async function asignarInsignia(req, res) {
  try {
    const { userId, insigniaId } = req.body;

    const persona = await Persona.findById(userId);
    if (!persona) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const insignia = await Insignia.findById(insigniaId);
    if (!insignia) {
      return res.status(404).json({ error: 'Insignia no encontrada' });
    }

    // Verificar si el usuario ya tiene la insignia
    if (insignia.usuarios.includes(userId)) {
      return res.status(400).json({ error: 'El usuario ya tiene esta insignia' });
    }

    // Agregar usuario a la insignia
    insignia.usuarios.push(userId);
    await insignia.save();

    // Agregar insignia al usuario
    persona.insignias.push({
      insignia_id: insigniaId,
      nombre_insignia: insignia.nombre
    });
    await persona.save();

    res.json({ data: { persona, insignia } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Quitar insignia a un usuario
async function quitarInsignia(req, res) {
  try {
    const { userId, insigniaId } = req.body;

    const persona = await Persona.findById(userId);
    if (!persona) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const insignia = await Insignia.findById(insigniaId);
    if (!insignia) {
      return res.status(404).json({ error: 'Insignia no encontrada' });
    }

    // Quitar usuario de la insignia
    insignia.usuarios = insignia.usuarios.filter(id => id.toString() !== userId);
    await insignia.save();

    // Quitar insignia del usuario
    persona.insignias = persona.insignias.filter(i => i.insignia_id !== insigniaId);
    await persona.save();

    res.json({ data: { persona, insignia } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Listar insignias de un usuario
async function listarInsigniasUsuario(req, res) {
  try {
    const { userId } = req.params;
    const persona = await Persona.findById(userId)
      .populate({
        path: 'insignias.insignia_id',
        model: 'Insignia',
        select: 'nombre imagen descripcion' // Select the fields you need from the Insignia model
      });

    if (!persona) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Map insignias to a more usable format for the frontend
    const insigniasPopulated = persona.insignias.map(item => ({
      _id: item.insignia_id._id,
      nombre_insignia: item.insignia_id.nombre,
      descripcion: item.insignia_id.descripcion,
      imagen: item.insignia_id.imagen,
      fecha_otorgada: item.fecha_otorgada,
      mod_id: item.mod_id
    }));
    
    res.json({ insignias: insigniasPopulated });
  } catch (error) {
    console.error('Error en listarInsigniasUsuario:', error);
    res.status(500).json({ error: error.message });
  }
}

// Editar una insignia
async function editarInsignia(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const imagen = req.file;

    const insignia = await Insignia.findById(id);
    if (!insignia) {
      return res.status(404).json({ error: 'Insignia no encontrada' });
    }

    // Si hay una nueva imagen, subirla a Cloudinary
    if (imagen) {
      const result = await cloudinary.uploader.upload(imagen.path, {
        folder: 'insignias',
        resource_type: 'auto'
      });
      insignia.imagen = result.secure_url;
    }

    // Actualizar campos
    if (nombre) insignia.nombre = nombre;
    if (descripcion) insignia.descripcion = descripcion;

    await insignia.save();
    res.json({ data: insignia });
  } catch (error) {
    console.error('Error en editarInsignia:', error);
    res.status(500).json({ error: error.message });
  }
}

// Eliminar una insignia
async function eliminarInsignia(req, res) {
  try {
    const { id } = req.params;

    const insignia = await Insignia.findById(id);
    if (!insignia) {
      return res.status(404).json({ error: 'Insignia no encontrada' });
    }

    // Eliminar la imagen de Cloudinary si existe
    if (insignia.imagen) {
      const publicId = insignia.imagen.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Eliminar la insignia de todos los usuarios que la tengan
    await Persona.updateMany(
      { 'insignias.insignia_id': id },
      { $pull: { insignias: { insignia_id: id } } }
    );

    // Eliminar la insignia
    await insignia.deleteOne();

    res.json({ message: 'Insignia eliminada correctamente' });
  } catch (error) {
    console.error('Error en eliminarInsignia:', error);
    res.status(500).json({ error: error.message });
  }
}

// Obtener una insignia específica
async function obtenerInsignia(req, res) {
  try {
    const { id } = req.params;
    const insignia = await Insignia.findById(id).populate('usuarios', 'nombre email');
    
    if (!insignia) {
      return res.status(404).json({ error: 'Insignia no encontrada' });
    }

    res.json({ data: insignia });
  } catch (error) {
    console.error('Error en obtenerInsignia:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  crearInsignia,
  listarInsignias,
  asignarInsignia,
  quitarInsignia,
  listarInsigniasUsuario,
  editarInsignia,
  eliminarInsignia,
  obtenerInsignia
}; 