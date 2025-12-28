import { mapImageToComplete, mapToImageSummaries, mapToImageSummary } from '@/transformers/image/mappers';
import type { ImageWithStats } from '@/types/entities/image/base';

describe('Image transformers', () => {
	it('mapImageToComplete rellena campos y stats', () => {
		const now = new Date();
		const result = mapImageToComplete({
			id: 'img1',
			name: 'x',
			path: '/tmp/a.jpg',
			hash: 'h',
			size: 10,
			width: 5,
			height: 5,
			createdAt: now,
			updatedAt: now,
			addedAt: now,
			folderId: 'f1',
		});

		expect(result.entityType).toBe('image');
		expect(result.stats).toBeTruthy();
		expect(typeof result.stats.aspectRatio).toBe('number');
		expect(result.thumbnailUrl).toBe(result.thumbnail ?? '');
		expect(result.fullUrl).toBe(result.path);
		expect(result.folderId).toBe('f1');
	});

	it('mapToImageSummary extrae campos esperados', () => {
		const img = mapImageToComplete({
			id: 'id',
			name: 'n',
			path: 'p',
			hash: 'h',
			size: 1,
			width: 2,
			height: 3,
			folderId: 'f1',
		});
		const s = mapToImageSummary(img as ImageWithStats);
		expect(s.id).toBe('id');
		expect(s.name).toBe('n');
		expect(s.path).toBe('p');
		expect(s.folderId).toBe('f1');
		expect(s.hash).toBe('h');
		expect(s.width).toBe(2);
		expect(s.height).toBe(3);
	});

	it('mapToImageSummaries procesa listas', () => {
		const a = mapImageToComplete({
			id: 'a',
			name: 'a',
			path: 'pa',
			hash: 'ha',
			size: 1,
			width: 1,
			height: 1,
			folderId: 'f',
		}) as ImageWithStats;
		const b = mapImageToComplete({
			id: 'b',
			name: 'b',
			path: 'pb',
			hash: 'hb',
			size: 2,
			width: 2,
			height: 2,
			folderId: 'f',
		}) as ImageWithStats;
		const arr = mapToImageSummaries([a, b]);
		expect(arr.length).toBe(2);
		expect(arr[0].id).toBe('a');
		expect(arr[1].id).toBe('b');
	});
});
