import { CacheManager } from '../cache';

// 🧪 Pruebas de CacheManager para validar TTL y tamaño máximo

describe('🗄️ CacheManager', () => {
	it('📥 almacena y recupera valores', async () => {
		const cache = new CacheManager<number>({ ttl: 1000 });
		await cache.set('A', 1);
		await expect(cache.get('A')).resolves.toBe(1);
	});

	it('⏳ expira elementos según TTL', async () => {
		jest.useFakeTimers();
		const cache = new CacheManager<number>({ ttl: 50 });
		await cache.set('A', 1);
		jest.advanceTimersByTime(60);
		await expect(cache.get('A')).resolves.toBeUndefined();
		jest.useRealTimers();
	});

	it('🧹 expulsa el más antiguo al superar maxSize', async () => {
		const cache = new CacheManager<number>({ maxSize: 2 });
		await cache.set('one', 1);
		await cache.set('two', 2);
		await cache.set('three', 3);
		const diag = await cache.diagnose();
		expect(diag.total).toBe(2);
		expect(diag.keys).toContain('three');
	});
});
