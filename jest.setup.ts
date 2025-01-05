import '@testing-library/jest-dom'

// Mock de fetch para pruebas
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Establecer NODE_ENV para pruebas
process.env.NODE_ENV = 'test';

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks()
})