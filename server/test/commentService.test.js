// test/commentService.test.js
const CommentService = require('../services/commentService');
const CommentRepository = require('../repositories/CommentRepository');
const CommentFactory = require('../factories/CommentFactory');

// Datos de prueba
const validData = {
  reviewId: "review123",
  comment_txt: "Excelente reseña",
  userId: "user1"
};

// Creamos un objeto fake para simular el comentario creado
const fakeComment = {
  _id: "comment123",
  reviewId: validData.reviewId,
  comment_txt: validData.comment_txt,
  userId: validData.userId,
  liked_comment: [],
  populate: jest.fn().mockResolvedValue(this)
};

describe('CommentService.createComment', () => {
  beforeEach(() => {
    // Simular que no existe ningún comentario para esa reseña y usuario.
    jest.spyOn(CommentRepository, 'findOne').mockResolvedValue(null);
    // Mock de la fábrica: retorna el comentario fake.
    jest.spyOn(CommentFactory, 'create').mockReturnValue(fakeComment);
    // Simular que al guardar el comentario se retorna el objeto fake.
    jest.spyOn(CommentRepository, 'create').mockResolvedValue(fakeComment);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debe crear un comentario correctamente cuando no existe uno previo', async () => {
    const comment = await CommentService.createComment(validData);
    expect(CommentRepository.findOne).toHaveBeenCalledWith({
      reviewId: validData.reviewId,
      userId: validData.userId
    });
    expect(CommentFactory.create).toHaveBeenCalledWith(validData);
    expect(CommentRepository.create).toHaveBeenCalledWith(fakeComment);
    expect(comment).toEqual(fakeComment);
  });

  test('Debe arrojar un error si faltan campos requeridos', async () => {
    const incompleteData = { ...validData };
    delete incompleteData.comment_txt;
    await expect(CommentService.createComment(incompleteData))
      .rejects
      .toThrow(/Faltan campos requeridos/);
  });

  test('Debe arrojar un error si ya existe un comentario para esa reseña y usuario', async () => {
    jest.spyOn(CommentRepository, 'findOne').mockResolvedValue({ _id: "existing" });
    await expect(CommentService.createComment(validData))
      .rejects
      .toThrow('Ya has dejado un comentario en esta reseña.');
  });
});
