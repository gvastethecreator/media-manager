/**
 * @file MIME Type Utilities
 * @module server/utils/mime
 * @description Mapeo de extensiones de archivo a tipos MIME para servir contenido.
 * Extraído de images.effect.ts para centralizar y evitar duplicación.
 */

const MIME_MAP: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	bmp: 'image/bmp',
	avif: 'image/avif',
	ico: 'image/x-icon',
	pdf: 'application/pdf',
	mp4: 'video/mp4',
	mov: 'video/quicktime',
	webm: 'video/webm',
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	flac: 'audio/flac',
};

/**
 * Resuelve el MIME type a partir de la extensión de una ruta de archivo.
 */
export function getMimeTypeFromPath(filePath: string): string {
	const ext = filePath.split('.').pop()?.toLowerCase();
	return (ext && MIME_MAP[ext]) || 'application/octet-stream';
}
