import { createCoreSlice } from './core.slice';

describe('Metadata Core Slice', () => {
  it('debe inicializar el estado correctamente', () => {
    const set = jest.fn();
    const get = jest.fn(() => ({}));
    const slice = createCoreSlice(set, get);
    expect(slice.metadatas).toEqual([]);
    expect(slice.isLoading).toBe(false);
    expect(slice.error).toBeNull();
  });
});
