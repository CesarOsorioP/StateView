// controllers/itemController.js
const Item = require('../models/Item');

async function getItemRating(req, res) {
  try {
    const { itemId } = req.params;

    // Buscar el item usando su _id
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Retornar información relevante: rating, título, tipo, etc.
    res.status(200).json({
      itemId: item._id,
      titulo: item.titulo,
      tipo: item.tipo,
      rating: item.rating,
      genero: item.genero,
      fechaSalida: item.fechaSalida
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getItemRating };
