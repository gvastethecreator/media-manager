import { describe, expect, it } from 'vitest';
import { toEmbeddedFolderPreviewThumbnail } from './folder-preview-media.service';

describe('toEmbeddedFolderPreviewThumbnail', () => {
	it('detecta el MIME ráster desde los bytes y no desde datos históricos', () => {
		const jpeg = toEmbeddedFolderPreviewThumbnail('/9j/4AAQSkZJRg==');
		expect(jpeg?.dataUrl).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg==');
	});

	it('descarta SVG u otros datos que no son una imagen ráster', () => {
		expect(toEmbeddedFolderPreviewThumbnail(Buffer.from('<svg/>').toString('base64'))).toBeUndefined();
	});

	it('aplica un límite por thumbnail antes de formar una data URL', () => {
		expect(toEmbeddedFolderPreviewThumbnail('A'.repeat(700_000))).toBeUndefined();
	});
});
