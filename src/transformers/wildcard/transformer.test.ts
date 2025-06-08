import { transformWildcard } from './transformer';

describe('transformWildcard', () => {
  it('lanza error si el input es nulo', () => {
    expect(() => transformWildcard(null as any)).toThrow('El objeto a transformar es nulo o indefinido');
  });
  it('transforma un objeto válido', () => {
    const input = { id: '1', name: 'Test wildcard' };
    const result = transformWildcard(input as any);
    expect(result).toHaveProperty('id', '1');
    expect(result).toHaveProperty('name', 'Test wildcard');
  });
});
