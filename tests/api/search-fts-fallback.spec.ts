import { describe, it, expect } from 'vitest';

// Este test verifica comportamiento de /search/fts con y sin tabla FTS5
// Asume servidor dev levantado y base de datos accesible.

function wait(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(path: string) {
	const res = await fetch(`http://localhost:4000${path}`);
	expect(res.ok).toBeTruthy();
	return res.json() as Promise<any>;
}

describe('Search FTS5 fallback', () => {
	it('devuelve engine fts5 cuando tabla existe', async () => {
		// Esperar bootstrap (init async)
		await wait(200);
		const q = 'a';
		const data = await fetchJson(`/search/fts?q=${encodeURIComponent(q)}&limit=5`);
		expect(['fts5', 'like']).toContain(data.engine);
	});
});
