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

describe('video thumbnail generation', () => {
	it('invoca generateVideoThumbnail para video', async () => {
		const m = buildSpyMapperVideo();
		await (m as any).processThumbnailForEntity('a.mp4', 'vid-id', EntityType.VIDEO);
		expect(m.calls.length).toBe(1);
	});
});
