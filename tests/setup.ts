import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Asegurar flags de entorno para ejecución de tests unitarios
// - Fuerza detección de "test" en módulos compartidos (p.ej. Drizzle)
// - Evita inicializaciones pesadas (FTS5) durante unit tests
// @ts-expect-error - TS marca NODE_ENV readonly pero asignamos antes de que se "congele"
process.env.NODE_ENV ??= 'test';
process.env.DISABLE_FTS5 ??= '1';

// Polyfill sencillo de ResizeObserver para jsdom
class ResizeObserverMock {
	observe() {
		/* noop */
	}
	unobserve() {
		/* noop */
	}
	disconnect() {
		/* noop */
	}
}

// Solo asignar si no existe (jsdom moderno ya lo tiene)
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// Polyfill requestAnimationFrame/cancelAnimationFrame si no existen
if (typeof globalThis.requestAnimationFrame === 'undefined') {
	globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
		setTimeout(() => cb(Date.now()), 0) as unknown as number;
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
	globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
}

// Mock IntersectionObserver si no existe
if (typeof globalThis.IntersectionObserver === 'undefined') {
	class IntersectionObserverMock {
		observe() {
			/* noop */
		}
		unobserve() {
			/* noop */
		}
		disconnect() {
			/* noop */
		}
	}
	// @ts-expect-error mock simple
	globalThis.IntersectionObserver = IntersectionObserverMock;
}

// Evitar advertencias de act con React 19
// @ts-expect-error React testing flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock matchMedia (necesario para algunos componentes UI)
if (typeof window !== 'undefined' && !window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

// Limpiar después de cada test (React Testing Library)
afterEach(() => {
	cleanup();
});
