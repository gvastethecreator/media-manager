import { fromPrismaWildcard } from './transformer';

// ✅ Test actualizado: usa asserts directos y patrón moderno, sin wrappers legacy

describe('fromPrismaWildcard', () => {
	it('retorna null si el input es nulo', () => {
		const result = fromPrismaWildcard(null);
		expect(result).toBeNull();
	});
	it('transforma un objeto válido', () => {
		const input = {
			id: '1',
			name: 'Test wildcard',
			content: '[]',
			filters: '{}',
			_count: {}
		};
		const result = fromPrismaWildcard(input as any);
		expect(result).toHaveProperty('id', '1');
		expect(result).toHaveProperty('name', 'Test wildcard');
	});
});

// 📝 Mantener tipado estricto y asserts claros en todos los tests de transformers
