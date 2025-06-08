import { createCoreSlice } from './core';

describe('Folder Core Slice', () => {
	it('debe inicializar el estado correctamente', () => {
		const set = jest.fn();
		const get = jest.fn(() => ({}));
		const slice = createCoreSlice(set, get);
		expect(slice.coreState).toBeDefined();
		expect(slice.coreState.folders).toEqual([]);
		expect(slice.coreState.loading).toBe(false);
		expect(slice.coreState.error).toBeNull();
	});
});
