// test/reviewService.test.js
const mongoose = require('mongoose');
const ReviewService = require('../services/reviewService');
const ReviewRepository = require('../repositories/ReviewRepository');
const ReviewFactory = require('../factories/ReviewFactory');
const Pelicula = require('../models/Pelicula');

// Debido a que el servicio utiliza internamente "findItemById" y "updateItemRating"
// que a su vez llaman a métodos del modelo, simularemos (mockearemos) el método
// Pelicula.findById para que retorne un objeto "fake" que utilizaremos en los tests.

describe('ReviewService.createReview', () => {
  // Datos de entrada para los tests
  const validData = {
    userId: "user1",
    // Usamos un string válido para ObjectId (puedes usar un string de 24 caracteres hexadecimales)
    itemId: "507f1f77bcf86cd799439011",
    review_txt: "Gran película!",
    rating: "4.5",  // simulando que viene en formato string
    onModel: "Pelicula"
  };

  // Creamos un fake item para simular la búsqueda en el modelo Pelicula
  const fakeItem = {
    _id: "507f1f77bcf86cd799439011",
    totalRating: 10,
    ratingCount: 2,
    averageRating: 5,
    // Para la función "updateItemRating" implementamos save como un mock que retorna la instancia (this) ya modificada
    save: jest.fn(function () {
      return Promise.resolve(this);
    })
  };

  // Creamos un fake review devuelto por el ReviewFactory
  const fakeReview = {
    _id: "review123",
    userId: validData.userId,
    review_txt: validData.review_txt,
    rating: 4.5,
    // Otros campos según el esquema...
  };

  // Antes de cada test, se “mockean” los métodos externos utilizados en el servicio
  beforeEach(() => {
    // Simular que no existe una reseña para el mismo usuario e ítem
    jest.spyOn(ReviewRepository, 'findOne').mockResolvedValue(null);
    // Cuando se invoque el factory, retorna el objeto fakeReview
    jest.spyOn(ReviewFactory, 'create').mockReturnValue(fakeReview);
    // Simular que al guardar la reseña se retorne el fakeReview
    jest.spyOn(ReviewRepository, 'create').mockResolvedValue(fakeReview);

    // Para la búsqueda de ítems, cuando se invoque Pelicula.findById,
    // se retorne el fakeItem.
    jest.spyOn(Pelicula, 'findById').mockResolvedValue(fakeItem);
  });

  // Después de cada test, se restablecen los mocks
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debe crear una reseña correctamente cuando no existe una previa', async () => {
    // Ejecutar el método de servicio
    const result = await ReviewService.createReview(validData);

    // Verificar que se llamó al repositorio para buscar si el review ya existe
    expect(ReviewRepository.findOne).toHaveBeenCalledWith({ 
      userId: validData.userId, 
      itemId: fakeItem._id, 
      onModel: validData.onModel 
    });

    // Verificar que se llamó al factory para crear la reseña
    expect(ReviewFactory.create).toHaveBeenCalledWith(validData, fakeItem._id);

    // Verificar que se creó la reseña a través del repositorio
    expect(ReviewRepository.create).toHaveBeenCalledWith(fakeReview);

    // Actualización del ítem (la función updateItemRating se ejecuta internamente)
    // Dado que fakeItem.totalRating era 10 y rating es 4.5, se espera que se sume
    // La actualización: totalRating = 14.5, ratingCount = 3 y averageRating ≈ 4.8333
    expect(fakeItem.save).toHaveBeenCalled();
    expect(fakeItem.totalRating).toBeCloseTo(14.5);
    expect(fakeItem.ratingCount).toBe(3);
    expect(fakeItem.averageRating).toBeCloseTo(14.5 / 3, 5);

    // Verificar que el método devuelve un objeto con review y updatedItem
    expect(result).toEqual({
      review: fakeReview,
      updatedItem: fakeItem
    });
  });

  test('Debe arrojar error si faltan campos requeridos', async () => {
    // Removemos algún campo obligatorio, por ejemplo, review_txt
    const incompleteData = { ...validData };
    delete incompleteData.review_txt;

    await expect(ReviewService.createReview(incompleteData))
      .rejects
      .toThrow('Faltan campos requeridos.');
  });

  test('Debe arrojar error si ya existe una reseña por el usuario para ese ítem', async () => {
    // Simulamos que ya existe una reseña.
    jest.spyOn(ReviewRepository, 'findOne').mockResolvedValue({ _id: 'existente' });

    await expect(ReviewService.createReview(validData))
      .rejects
      .toThrow('Ya has reseñado este contenido. Puedes editar o eliminar la reseña existente.');
  });
});
