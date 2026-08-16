import { describe, expect, it } from 'vitest';
import { buildFolderPreviewSvg, extractRecentPreviews, normalizePreviewFiles } from './folder-preview-svg';

describe('folder preview URLs', () => {
	it('conserva sólo rutas relativas de la API para previews de carpeta', () => {
		const payload = {
			files: [
				{ id: 'image-1', name: 'Imagen', thumbnailPath: '/api/images/image-1/thumbnail' },
				{ id: 'video-1', name: 'Video', thumbnailPath: '/api/videos/video-1/thumbnail' },
				{ id: 'event', name: 'Evento', thumbnailPath: '/api/events/stream' },
				{
					id: 'style-injection',
					name: 'Inyección',
					thumbnailPath: '/api/images/image-1/thumbnail") , url(https://example.test/tracker.png) /*',
				},
				{ id: 'remote', name: 'Remoto', thumbnailPath: 'https://cdn.example.test/preview.webp' },
				{ id: 'relative', name: 'Inseguro', thumbnailPath: 'images/image-2/thumbnail' },
			],
		};

		expect(normalizePreviewFiles(payload, 4)).toEqual([
			{ id: 'image-1', name: 'Imagen', thumbnailPath: '/api/images/image-1/thumbnail' },
			{ id: 'video-1', name: 'Video', thumbnailPath: '/api/videos/video-1/thumbnail' },
		]);
		expect(extractRecentPreviews(payload, 4)).toEqual([
			{ id: 'image-1', name: 'Imagen', thumbnailUrl: '/api/images/image-1/thumbnail' },
			{ id: 'video-1', name: 'Video', thumbnailUrl: '/api/videos/video-1/thumbnail' },
		]);
	});

	it('renderiza un SVG autosuficiente, conserva thumbnails inline y escapa metadatos', () => {
		const svg = buildFolderPreviewSvg({
			name: 'Carpeta <script>',
			path: 'coleccion & archivo',
			previewFiles: [
				{
					id: 'image-1',
					name: 'Imagen',
					thumbnailDataUrl: 'data:image/webp;base64,aGVsbG8=',
					thumbnailPath: '/api/images/image-1/thumbnail',
				},
			],
			totalFiles: 1,
			totalSize: '1 KB',
		});

		expect(svg).toContain('href="data:image/webp;base64,aGVsbG8="');
		expect(svg).not.toContain('href="/api/');
		expect(svg).toContain('Carpeta &lt;script&gt;');
		expect(svg).toContain('coleccion &amp; archivo');
	});

	it('descarta datos inline que no cumplen el contrato ráster', () => {
		const svg = buildFolderPreviewSvg({
			name: 'Carpeta segura',
			path: 'coleccion',
			previewFiles: [
				{
					id: 'svg',
					name: 'Intento SVG',
					thumbnailDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
					thumbnailPath: '/api/images/image-1/thumbnail',
				},
			],
			totalFiles: 1,
			totalSize: '1 KB',
		});

		expect(svg).not.toContain('data:image/svg+xml');
		expect(svg).not.toContain('href="/api/');
	});
});
