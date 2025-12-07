// test/personaService.test.js
const PersonaService = require('../services/personaService');
const PersonaRepository = require('../repositories/PersonaRepository');
const PersonaFactory = require('../factories/PersonaFactory');

// Aplica mocks a las dependencias
jest.mock('../repositories/PersonaRepository');
jest.mock('../factories/PersonaFactory');

describe('Pruebas unitarias en PersonaService: crearPersona', () => {
  // Se resetean los mocks antes de cada test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('Debe arrojar error si el email ya existe', async () => {
    // Arrange: Simulamos que hay una persona con el email enviado.
    const personaExistente = { _id: '12345', email: 'test@example.com' };
    PersonaRepository.findOne.mockResolvedValue(personaExistente);

    const data = {
      nombre: 'Test User',
      email: 'test@example.com',
      contraseña: 'password'
    };

    // Act & Assert: Se espera que la función lance un error.
    await expect(PersonaService.crearPersona(data))
      .rejects
      .toThrow('El email ya está registrado.');

    // Verificamos que no hayan llamado al factory ni al método de creación en el repositorio
    expect(PersonaFactory.create).not.toHaveBeenCalled();
    expect(PersonaRepository.create).not.toHaveBeenCalled();
  });

  test('Debe crear y guardar una nueva persona si el email no existe', async () => {
    // Arrange: Simulamos que no se encontró una persona con ese email.
    PersonaRepository.findOne.mockResolvedValue(null);

    // Simulamos que el factory crea una instancia de persona (por ejemplo, con la contraseña hasheada).
    const nuevaPersona = { _id: '67890', nombre: 'Test User', email: 'test@example.com', contraseña: 'hashed' };
    PersonaFactory.create.mockResolvedValue(nuevaPersona);

    // Simulamos que el repositorio al guardar retorna la misma instancia.
    PersonaRepository.create.mockResolvedValue(nuevaPersona);

    const data = {
      nombre: 'Test User',
      email: 'test@example.com',
      contraseña: 'password'
    };

    // Act: Ejecutamos la función
    const result = await PersonaService.crearPersona(data);

    // Assert: Verificamos que se hayan llamado los métodos correctamente y que se retorne la persona creada.
    expect(PersonaRepository.findOne).toHaveBeenCalledWith({ email: data.email });
    expect(PersonaFactory.create).toHaveBeenCalledWith(data);
    expect(PersonaRepository.create).toHaveBeenCalledWith(nuevaPersona);
    expect(result).toEqual(nuevaPersona);
  });
});
