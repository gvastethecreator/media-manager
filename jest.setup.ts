import '@testing-library/jest-dom';
import { afterEach, jest } from '@jest/globals';

// Mock next/cache to avoid Request-related errors in tests
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: (fn: any) => fn,
}));
// Mock nanoid to avoid ESM parsing issues
jest.mock('nanoid');

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

// Polyfill para TextEncoder/TextDecoder usados por Next.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;
