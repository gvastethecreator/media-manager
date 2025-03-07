import '@testing-library/jest-dom';
import { afterEach, jest } from '@jest/globals';

// Mock de fetch para pruebas
global.fetch = jest.fn(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve({}),
	})
) as jest.Mock;

// Limpiar mocks después de cada prueba
afterEach(() => {
	jest.clearAllMocks();
});
