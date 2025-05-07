// controllers/commentController.js
const Comment = require('../models/Comment');

// Crea un comentario para una reseña
const createComment = async (req, res) => {
  try {
    const { reviewId, comment_txt } = req.body;
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    if (!reviewId || !comment_txt) {
      return res.status(400).json({ error: 'Faltan campos requeridos: reviewId y/o comment_txt.' });
    }
    
    // Verificar si el usuario ya ha dejado un comentario en esta reseña
    const existingComment = await Comment.findOne({ reviewId, userId });
    if (existingComment) {
      return res.status(400).json({ 
        error: 'Ya has dejado un comentario en esta reseña.',
        existingComment // Devolvemos el comentario existente para referencia
      });
    }
    
    const comment = new Comment({ reviewId, userId, comment_txt });
    await comment.save();
    
    // Populamos el usuario para que el frontend tenga los datos completos
    await comment.populate('userId', 'nombre email username');
    
    res.status(201).json({ message: 'Comentario creado exitosamente.', comment });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el comentario: ' + error.message });
  }
};

// Edita un comentario existente
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment_txt } = req.body;
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    
    if (!comment_txt || comment_txt.trim() === '') {
      return res.status(400).json({ error: 'El texto del comentario no puede estar vacío.' });
    }
    
    // Buscar el comentario por ID
    const comment = await Comment.findById(commentId);
    
    // Verificar si el comentario existe
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }
    
    // Verificar si el usuario actual es el autor del comentario
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar este comentario.' });
    }
    
    // Actualizar el texto del comentario
    comment.comment_txt = comment_txt;
    // Opcional: Agregar campo para indicar que fue editado
    comment.isEdited = true;
    comment.editDate = Date.now();
    
    await comment.save();
    
    // Populamos el usuario para devolver datos completos
    await comment.populate('userId', 'nombre email username');
    
    res.json({ 
      message: 'Comentario actualizado exitosamente.', 
      comment 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el comentario: ' + error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { reviewId } = req.query;
    if (!reviewId) {
      return res.status(400).json({ error: 'El parámetro reviewId es obligatorio.' });
    }
    
    const comments = await Comment.find({ reviewId })
      .populate('userId', 'nombre email username');
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los comentarios: ' + error.message });
  }
};


// Elimina un comentario
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    
    // Buscar el comentario por ID
    const comment = await Comment.findById(commentId);
    
    // Verificar si el comentario existe
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }
    
    // Verificar si el usuario actual es el autor del comentario
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario.' });
    }
    
    // Eliminar el comentario
    await Comment.findByIdAndDelete(commentId);
    
    res.json({ message: 'Comentario eliminado exitosamente.', commentId });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el comentario: ' + error.message });
  }
};

// Agrega un "me gusta" a un comentario
const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    
    // Se asume que el nombre del usuario viene en req.user.nombre (podrías ajustarlo según tus necesidades)
    const userName = req.user.nombre || "Anónimo";
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }
    
    // Verificar si el usuario ya dio "me gusta" al comentario
    const alreadyLiked = comment.liked_comment.some(like => like.id_liked_comment.equals(userId));
    if (alreadyLiked) {
      return res.status(400).json({ error: 'Ya has dado me gusta a este comentario.' });
    }
    
    // Agregar el like usando el sub-esquema definido
    comment.liked_comment.push({
      id_liked_comment: userId,
      nombre_persona_comment: userName,
      id_persona_comment: userId
    });
    
    await comment.save();
    res.json({ message: 'Me gusta agregado.', totalLikes: comment.liked_comment.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al dar me gusta: ' + error.message });
  }
};

// Elimina (o remueve) el "me gusta" de un comentario
const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }
    
    // Buscar el índice del like en el array
    const likeIndex = comment.liked_comment.findIndex(like => like.id_liked_comment.equals(userId));
    if (likeIndex === -1) {
      return res.status(400).json({ error: 'No has dado me gusta a este comentario.' });
    }
    
    // Remover el "me gusta"
    comment.liked_comment.splice(likeIndex, 1);
    await comment.save();
    
    res.json({ message: 'Me gusta removido.', totalLikes: comment.liked_comment.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al remover me gusta: ' + error.message });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment
};