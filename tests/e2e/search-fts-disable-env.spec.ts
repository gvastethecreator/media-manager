import { expect, test } from '@playwright/test';

// Escenario: si el servidor se inició con DISABLE_FTS5=1, el engine debe ser 'like'.
// Si no, aceptamos 'fts5' o 'like' (fallback por no soporte) para no generar falsos negativos.

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

async function fetchJson(path: string) {
	const res = await fetch(`${BASE_URL}${path}`);
	expect(res.ok, `Respuesta HTTP no OK para ${path}`).toBeTruthy();
	return res.json() as Promise<any>;
}

test.describe('Search FTS5 (deshabilitable)', () => {
	test('engine consistente con DISABLE_FTS5', async () => {
		// Pequeña espera para asegurar arranque de servidor en entornos CI lentos
		await new Promise((r) => setTimeout(r, 150));
		const query = 'a';
		const data = await fetchJson(`/search/fts?q=${encodeURIComponent(query)}&limit=2`);
		expect(['like', 'fts5']).toContain(data.engine);
		if (process.env.DISABLE_FTS5 === '1') {
			expect(data.engine).toBe('like');
		}
		// Validar shape mínimo
		expect(Array.isArray(data.results)).toBe(true);
		expect(typeof data.total === 'number').toBe(true);
	});
});
