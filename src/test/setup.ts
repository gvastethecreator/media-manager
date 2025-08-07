import '@testing-library/jest-dom';
import { mock } from 'bun:test';
import { JSDOM } from 'jsdom';

// Configurar JSDOM para Bun test
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
	url: 'http://localhost',
	pretendToBeVisual: true,
	resources: 'usable',
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Configuración global para Bun test
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: mock((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: mock(), // deprecated
		removeListener: mock(), // deprecated
		addEventListener: mock(),
		removeEventListener: mock(),
		dispatchEvent: mock(),
	})),
});

// Mock para ResizeObserver
global.ResizeObserver = mock(() => ({
	observe: mock(),
	unobserve: mock(),
	disconnect: mock(),
}));

// Mock para IntersectionObserver
global.IntersectionObserver = mock(() => ({
	observe: mock(),
	unobserve: mock(),
	disconnect: mock(),
}));

// Mock para window.scrollTo
Object.defineProperty(window, 'scrollTo', {
	value: mock(),
	writable: true,
});
