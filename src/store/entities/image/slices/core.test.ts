import { createImageCoreSlice } from './core';

describe('Image Core Slice', () => {
	it('debe inicializar el estado correctamente', () => {
		const set = jest.fn();
		const get = jest.fn(() => ({ core: { images: {} } }));
		const slice = createImageCoreSlice(set, get);
		expect(slice.getImages()).toEqual([]);
		// Validar que el estado inicial cumple con el tipado estricto
		expect(slice.images).toBeDefined();
	});
});

// 📝 Test actualizado: asserts directos, sin dependencias de patrones legacy
