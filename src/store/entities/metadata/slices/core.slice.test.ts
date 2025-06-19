import { createCoreSlice } from './core.slice';

describe('Metadata Core Slice', () => {
	it('debe inicializar el estado correctamente', () => {
		const set = jest.fn();
		const get = jest.fn(() => ({}));
		const slice = createCoreSlice(set, get);
		expect(Array.isArray(slice.metadatas)).toBe(true);
		expect(slice.isLoading).toBe(false);
		expect(slice.error).toBeNull();
	});
});

// 📝 Test actualizado: asserts directos, sin dependencias de patrones legacy
