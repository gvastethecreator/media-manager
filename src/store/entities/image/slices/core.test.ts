import { createImageCoreSlice } from './core';

describe('Image Core Slice', () => {
	it('debe inicializar el estado correctamente', () => {
		const set = jest.fn();
		const get = jest.fn(() => ({ core: { images: {} } }));
		const slice = createImageCoreSlice(set, get);
		expect(slice.getImages()).toEqual([]);
	});
});
