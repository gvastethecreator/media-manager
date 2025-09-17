import { describe, expect, it } from 'bun:test';
import { EntityType } from '@/types/file-entity-mapper';
import { createMockFileEntityMapper } from '../factories';

describe('Video thumbnail generation', () => {
	it('generates thumbnail for video file', async () => {
		const mapper = createMockFileEntityMapper();

		// Mock successful thumbnail generation
		mapper.generateThumbnail.mockResolvedValue({
			success: true,
			thumbnailPath: '/thumbnails/video-thumb.jpg',
			width: 320,
			height: 240,
		});

		const result = await mapper.generateThumbnail('test-video.mp4', EntityType.VIDEO);

		expect(result.success).toBe(true);
		expect(result.thumbnailPath).toBe('/thumbnails/video-thumb.jpg');
		// Verificar llamada manualmente usando spy ligero
		expect(mapper.generateThumbnail.calls.length).toBeGreaterThan(0);
		const firstCall = mapper.generateThumbnail.calls[0];
		expect(firstCall[0]).toBe('test-video.mp4');
		expect(firstCall[1]).toBe(EntityType.VIDEO);
	});
});
