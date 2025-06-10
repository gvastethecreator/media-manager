import { afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Polyfill global para TextEncoder/TextDecoder en entorno Node.js (para Next.js y tests)
if (typeof global.TextEncoder === 'undefined') {
	const { TextEncoder, TextDecoder } = require('util');
	global.TextEncoder = TextEncoder;
	global.TextDecoder = TextDecoder;
}

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
		text: () => Promise.resolve(''),
		blob: () => Promise.resolve(new Blob()),
	} as Response)
) as any;

// Mock global mínimo de Request para evitar ReferenceError en tests que importan next/cache
if (typeof global.Request === 'undefined') {
	// @ts-ignore - Ignorar errores de tipo para mock simplificado en tests
	global.Request = class MockRequest {
		headers = {};
		method = '';
		url = '';
		bodyUsed = false;
		cache = '';
		credentials = '';
		destination = '';
		integrity = '';
		keepalive = false;
		mode = '';
		redirect = '';
		referrer = '';
		referrerPolicy = '';
		signal = undefined;
		body = null;
		clone() {
			return this;
		}
		arrayBuffer() {
			return Promise.resolve(new ArrayBuffer(0));
		}
		blob() {
			return Promise.resolve(new Blob());
		}
		formData() {
			return Promise.resolve({});
		}
		json() {
			return Promise.resolve({});
		}
		text() {
			return Promise.resolve('');
		}
		bytes() {
			return Promise.resolve(new Uint8Array());
		}
	} as any;
}

// Mock global de prisma para evitar errores en tests que importan código de servidor
jest.mock('@/lib/prisma', () => ({
	PrismaClient: jest.fn(() => ({})),
	prisma: {},
}));

// Mock global de p-queue para evitar errores ESM en tests
jest.mock('p-queue', () => ({
	default: jest.fn(() => ({ add: jest.fn() })),
}));

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
