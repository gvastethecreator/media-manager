import { expect, test } from '@playwright/test';

function wait(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(path: string) {
	const res = await fetch(`http://localhost:4000${path}`);
	expect(res.ok).toBeTruthy();
	return res.json() as Promise<any>;
}

test.describe('Search FTS5 score', () => {
	test('incluye score cuando engine = fts5', async () => {
		await wait(250);
		const data = await fetchJson('/search/fts?q=test&limit=3');
		if (data.engine === 'fts5' && data.items.length > 0) {
			expect(data.items[0]).toHaveProperty('score');
			expect(typeof data.items[0].score).toBe('number');
		}
	});
});
