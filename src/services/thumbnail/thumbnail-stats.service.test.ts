import { describe, expect, it } from 'vitest';
import { loadThumbnailStatRows } from './thumbnail-stats.service';

describe('loadThumbnailStatRows', () => {
	it('loads scoped thumbnail source rows from services, not from the route', async () => {
		const rows = await loadThumbnailStatRows();
		expect(Array.isArray(rows.imageRows)).toBe(true);
		expect(Array.isArray(rows.videoRows)).toBe(true);
		expect(Array.isArray(rows.audioRows)).toBe(true);
		expect(Array.isArray(rows.documentRows)).toBe(true);
		expect(Array.isArray(rows.jsonRows)).toBe(true);
		expect(Array.isArray(rows.file3dRows)).toBe(true);
	});
});
