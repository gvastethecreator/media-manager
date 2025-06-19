import { createCoreSlice } from '../slices/core';

describe('Note Core Slice', () => {
	it('debe inicializar el estado correctamente', () => {
		const set = jest.fn();
		const get = jest.fn(() => ({}));
		const slice = createCoreSlice(set, get);
		expect(Array.isArray(slice.notes)).toBe(true);
		expect(slice.selectedNote).toBeNull();
		expect(slice.isLoading).toBe(false);
		expect(slice.error).toBeNull();
	});
});

// 📝 Test actualizado: asserts directos, sin dependencias de patrones legacy
