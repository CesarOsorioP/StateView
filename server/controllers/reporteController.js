const Reporte = require('../models/Reporte');
const Review = require('../models/Review');
const Comment = require('../models/Comment');

/**
 * Crea un nuevo reporte.
 * Se espera recibir en el body los siguientes campos:
 *   - reporter: ID del usuario que realiza el reporte.
 *   - reportedUser: ID del usuario reportado.
 *   - review (opcional): ID de la reseña que se está reportando.
 *   - comment (opcional): ID del comentario que se está reportando.
 *   - motivo: Texto que describe el motivo del reporte.
 */
async function crearReporte(req, res) {
  try {
    const { reporter, reportedUser, review, comment, motivo } = req.body;
    if (!reporter || !reportedUser || !motivo) {
      return res.status(400).json({ error: "Faltan campos obligatorios: reporter, reportedUser y motivo." });
    }
    
    // Validar que solo se reporte una reseña O un comentario, no ambos
    if (review && comment) {
      return res.status(400).json({ error: "No se puede reportar una reseña y un comentario al mismo tiempo." });
    }
    
    if (!review && !comment) {
      return res.status(400).json({ error: "Debe proporcionarse un review o un comment para reportar." });
    }
    
    let reportedContent = null;
    let contenido = null;
    let tipoContenido = null;
    let contenidoReportado = null;
    
    // Si hay una reseña reportada, obtener su contenido
    if (review) {
      const reviewData = await Review.findById(review);
      if (reviewData) {
        reportedContent = {
          texto: reviewData.review_txt,
          tipo: 'Reseña',
          contenidoTitulo: reviewData.itemId?.titulo || '',
          puntuacion: reviewData.rating,
          onModel: reviewData.onModel
        };
        contenido = reviewData.review_txt;
        tipoContenido = 'Reseña';
        contenidoReportado = reviewData.review_txt;
      } else {
        return res.status(404).json({ error: "Reseña no encontrada." });
      }
    }
    
    // Si hay un comentario reportado, obtener su contenido
    if (comment) {
      const commentData = await Comment.findById(comment).populate('reviewId');
      if (commentData) {
        reportedContent = {
          texto: commentData.comment_txt,
          tipo: 'Comentario',
          contenidoTitulo: commentData.reviewId?.itemId?.titulo || '',
          puntuacion: null,
          onModel: commentData.reviewId?.onModel || null
        };
        contenido = commentData.comment_txt;
        tipoContenido = 'Comentario';
        contenidoReportado = commentData.comment_txt;
      } else {
        return res.status(404).json({ error: "Comentario no encontrado." });
      }
    }
    
    const nuevoReporte = new Reporte({
      reporter,
      reportedUser,
      review: review || null,
      comment: comment || null,
      reportedContent,
      contenido,
      tipoContenido,
      contenidoReportado,
      motivo
    });
    
    await nuevoReporte.save();
    res.status(201).json({ message: "Reporte creado correctamente", data: nuevoReporte });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Obtiene (lista) los reportes.
 * Se puede filtrar por estado (pasando un query parameter `estado`).
 */
async function obtenerReportes(req, res) {
  try {
    const { estado } = req.query;
    const query = {};
    if (estado) {
      query.estado = estado;
    }
    
    const reportes = await Reporte.find(query)
      .populate("reporter", "nombre email")
      .populate("reportedUser", "nombre email")
      .populate("review")
      .populate("comment");
    
    res.status(200).json({ data: reportes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Actualiza un reporte.
 * Se espera enviar en el body:
 *   - estado: Puede ser "Pendiente", "Resuelto" o "Rechazado".
 *   - mod_id (opcional): El ID del moderador que procesa el reporte.
 */
async function actualizarReporte(req, res) {
  try {
    const { id } = req.params;
    const { estado, mod_id } = req.body;
    const estadosPermitidos = ["Pendiente", "Resuelto", "Rechazado"];
    
    if (!estado || !estadosPermitidos.includes(estado)) {
      return res.status(400).json({ error: `El estado debe ser uno de: ${estadosPermitidos.join(", ")}` });
    }
    
    const reporteActualizado = await Reporte.findByIdAndUpdate(
      id,
      { estado, mod_id },
      { new: true }
    );
    
    if (!reporteActualizado) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    
    res.status(200).json({ message: "Reporte actualizado correctamente", data: reporteActualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * (Opcional) Elimina un reporte.
 */
async function eliminarReporte(req, res) {
  try {
    const { id } = req.params;
    await Reporte.findByIdAndDelete(id);
    res.status(200).json({ message: "Reporte eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerItemReportado(req, res) {
  try {
    const { id } = req.params;
    // Buscamos el reporte por su ID y poblamos el campo "review"
    const reporte = await Reporte.findById(id).populate("review");
    if (!reporte) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    
    // Verificamos si el reporte tiene una reseña asociada
    if (reporte.review) {
      return res.status(200).json({ data: reporte.review });
    }
    
    // Si en el futuro se agregan otros campos (por ejemplo, "comment"), se puede incluir otra verificación:
    // if (reporte.comment) { ... }
    
    return res.status(404).json({ error: "El reporte no tiene una reseña o comentario asociado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  crearReporte,
  obtenerReportes,
  actualizarReporte,
  eliminarReporte, // Opcional, en algunos casos se prefiere solo actualizar los reportes.
  obtenerItemReportado,
};
