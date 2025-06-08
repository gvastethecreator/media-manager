import { deepMerge, getValueByPath, setValueByPath } from '../utils/object-utils';

// 🛠️ Pruebas para las utilidades de objetos

describe('🛠️ object-utils', () => {
	describe('deepMerge', () => {
		it('combina objetos simples', () => {
			const target = { a: 1, b: { c: 2 } };
			const source = { b: { d: 3 }, e: 4 };
			const result = deepMerge(target, source);
			expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
		});

		it('sobrescribe valores primitivos', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3 };
			const result = deepMerge(target, source);
			expect(result).toEqual({ a: 1, b: 3 });
		});
	});

	describe('getValueByPath', () => {
		const obj = { a: { b: { c: 5 } } };
		it('obtiene valores anidados', () => {
			expect(getValueByPath(obj, 'a.b.c')).toBe(5);
		});
		it('devuelve undefined para rutas inválidas', () => {
			expect(getValueByPath(obj, 'a.x.c')).toBeUndefined();
		});
	});

	describe('setValueByPath', () => {
		it('crea estructura al asignar valor anidado', () => {
			const base = { a: 1 };
			const result = setValueByPath(base, 'b.c.d', 10);
			expect(result).toEqual({ a: 1, b: { c: { d: 10 } } });
		});
	});
});
