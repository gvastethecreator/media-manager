import { describe, expect, it } from 'vitest';
import { normalizeSafePreviewImageUrl } from './preview-url';

describe('normalizeSafePreviewImageUrl', () => {
	it('preserva rutas locales de previews autorizados', () => {
		expect(normalizeSafePreviewImageUrl('/api/images/image-1/thumbnail')).toBe('/api/images/image-1/thumbnail');
		expect(normalizeSafePreviewImageUrl('/api/folders/folder-1/preview?max=4&layout=grid&v=2026-07-23')).toBe(
			'/api/folders/folder-1/preview?max=4&layout=grid&v=2026-07-23'
		);
		expect(normalizeSafePreviewImageUrl('/api/folders/folder-1/preview?max=4&layout=stack')).toBe(
			'/api/folders/folder-1/preview?max=4&layout=stack'
		);
		expect(normalizeSafePreviewImageUrl('/api/folders/folder-1/preview?width=256')).toBe(
			'/api/folders/folder-1/preview?width=256'
		);
	});

	it('acepta sólo data URLs de imagen ráster y base64 heredado', () => {
		expect(normalizeSafePreviewImageUrl('data:image/png;base64,aGVsbG8=')).toBe('data:image/png;base64,aGVsbG8=');
		expect(normalizeSafePreviewImageUrl(' aGVs\n bG8= ')).toBe('data:image/webp;base64,aGVsbG8=');
	});

	it('rechaza esquemas, rutas y fragmentos no autorizados', () => {
		for (const unsafe of [
			'blob:http://127.0.0.1:5173/preview',
			'file:///C:/private/image.webp',
			'https://cdn.example.test/preview.webp',
			'javascript:alert(1)',
			'data:image/svg+xml;base64,PHN2Zy8+',
			'/api/events/stream',
			'/api/images/image-1/thumbnail?size=small',
			'/api/folders/folder-1/preview?max=4&url=https://example.test/tracker.png',
			'/api/images/image-1/thumbnail") , url(https://example.test/tracker.png) /*',
			'/api/images/image-1/thumbnail#fragment',
		]) {
			expect(normalizeSafePreviewImageUrl(unsafe)).toBeNull();
		}
		expect(normalizeSafePreviewImageUrl('A'.repeat(1_000_001))).toBeNull();
	});
});
