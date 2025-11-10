import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// @ts-expect-error faltan tipos de jsdom en entorno Bun; solo se usa en tests
import { JSDOM } from 'jsdom';

// Configurar jsdom como entorno DOM para pruebas
const dom = new JSDOM('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true,
});

// Asignar globals esperados por React Testing Library y React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = globalThis as any;
globalAny.window = dom.window;
globalAny.document = dom.window.document;
globalAny.navigator = { userAgent: 'node.js' };
globalAny.requestAnimationFrame = (cb: FrameRequestCallback) =>
	setTimeout(() => cb(Date.now()), 0) as unknown as number;
globalAny.cancelAnimationFrame = (id: number) => clearTimeout(id);
// Polyfill sencillo de ResizeObserver para jsdom
class RO {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalAny.ResizeObserver = RO as any;

// Polyfill KeyboardEvent si no existe (algunos tests lo requieren)
if (typeof globalAny.KeyboardEvent === 'undefined') {
	class PolyfillKeyboardEvent extends dom.window.Event {
		key: string;
		constructor(type: string, options: any = {}) {
			super(type, options);
			this.key = options.key || '';
		}
	}
	globalAny.KeyboardEvent = PolyfillKeyboardEvent;
}

// Evitar advertencias de act con React 19
globalAny.IS_REACT_ACT_ENVIRONMENT = true;

// Limpiar después de cada test
afterEach(() => {
	cleanup();
});
