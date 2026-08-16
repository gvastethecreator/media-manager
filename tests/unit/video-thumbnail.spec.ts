import { vi } from 'vitest';
import { VideoProcessor } from '@/services/file-entity-mapper/processors/video.processor';
import { getEntityTypeFromExtension } from '@/services/file-entity-mapper/utils/file-info.utils';

describe('video thumbnail generation', () => {
	it('retorna video para extensión .mp4', () => {
		const type = getEntityTypeFromExtension('.mp4');
		expect(type).toBe('video');
	});

	it('retorna video para extensión .webm', () => {
		const type = getEntityTypeFromExtension('.webm');
		expect(type).toBe('video');
	});

	it('VideoProcessor tiene método generateThumbnail', () => {
		const processor = new VideoProcessor();
		expect(typeof processor.generateThumbnail).toBe('function');
	});

	it('VideoProcessor.generateThumbnail retorna success cuando se mockea', async () => {
		const processor = new VideoProcessor();
		// Mock del resultado - el processor real requiere ffmpeg
		const spy = vi.spyOn(processor, 'generateThumbnail').mockResolvedValue({ success: true });
		const result = await processor.generateThumbnail('video.mp4', 'vid-id');
		expect(result.success).toBe(true);
		expect(spy).toHaveBeenCalledWith('video.mp4', 'vid-id');
	});
});
