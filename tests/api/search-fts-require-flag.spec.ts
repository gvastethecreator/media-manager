import { describe, it, expect } from 'vitest';

// Este test asume que se puede lanzar servidor con SEARCH_FTS_REQUIRE=1 para validar error si FTS ausente.
// Si la tabla existe retornará 200; si no existe debe retornar 503 con { required: true }.

function wait(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function safeFetch(path: string) {
	const res = await fetch(`http://localhost:4000${path}`);
	let body: any = null;
	try {
		body = await res.json();
	} catch {
		/* ignore */
	}
	return { res, body };
}

describe('Search FTS5 require flag', () => {
	it('maneja flag SEARCH_FTS_REQUIRE', async () => {
		await wait(150);
		const { res, body } = await safeFetch('/search/fts?q=test&limit=1');
		if (res.status === 503) {
			expect(body?.required).toBe(true);
		} else {
			expect(res.status).toBe(200);
		}
	});
});
