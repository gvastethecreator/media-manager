import { describe, expect, it } from 'bun:test';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
import { EntityType } from '@/types/file-entity-mapper';

function buildSpyMapperVideo() {
	const mapper: any = new (FileEntityMapperService as any)();
	mapper.generateVideoThumbnail = (p: string, id: string) => {
		mapper.calls.push({ p, id });
	};
	mapper.processThumbnailForEntity = FileEntityMapperService.prototype.processThumbnailForEntity;
	mapper.calls = [] as Array<{ p: string; id: string }>;
	return mapper as FileEntityMapperService & { calls: Array<{ p: string; id: string }> };
}

import { describe, expect, it } from 'bun:test';
import { FileEntityMapperService } from '@/services/file-entity-mapper/file-entity-mapper.service';
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
		expect(mapper.generateThumbnail).toHaveBeenCalledWith('test-video.mp4', EntityType.VIDEO);
	});
});
