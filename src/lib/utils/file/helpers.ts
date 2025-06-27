/**
 * @file Utilidades para el manejo de archivos
 * @module utils/file/helpers
 */

// formatBytes se ha movido a @/lib/utils/format.utils.ts para evitar duplicación
// Importar desde allí si se necesita: import { formatBytes } from '@/lib/utils/format.utils';

/**
 * Extrae la extensión de un nombre de archivo
 * @param filename - El nombre del archivo
 * @returns La extensión del archivo sin el punto
 */
export function getFileExtension(filename: string): string {
	return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Verifica si la extensión de un archivo corresponde a un tipo de imagen
 * @param extension - La extensión del archivo
 * @returns true si es una extensión de imagen soportada
 */
export function isImageExtension(extension: string): boolean {
	const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'tiff'];
	return imageExtensions.includes(extension.toLowerCase());
}

/**
 * Verifica si la extensión de un archivo corresponde a un tipo de video
 * @param extension - La extensión del archivo
 * @returns true si es una extensión de video soportada
 */
export function isVideoExtension(extension: string): boolean {
	const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv'];
	return videoExtensions.includes(extension.toLowerCase());
}

/**
 * Obtiene un tipo MIME básico basado en la extensión del archivo
 * @param extension - La extensión del archivo
 * @returns El tipo MIME correspondiente o application/octet-stream si no se reconoce
 */
export function getMimeTypeFromExtension(extension: string): string {
	const mimeTypes: Record<string, string> = {
		// Imágenes
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		avif: 'image/avif',
		svg: 'image/svg+xml',
		tiff: 'image/tiff',

		// Videos
		mp4: 'video/mp4',
		webm: 'video/webm',
		avi: 'video/x-msvideo',
		mov: 'video/quicktime',
		mkv: 'video/x-matroska',
		flv: 'video/x-flv',

		// Documentos
		pdf: 'application/pdf',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xls: 'application/vnd.ms-excel',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		ppt: 'application/vnd.ms-powerpoint',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

		// Otros
		txt: 'text/plain',
		html: 'text/html',
		css: 'text/css',
		js: 'text/javascript',
		json: 'application/json',
		xml: 'application/xml',
		zip: 'application/zip',
		rar: 'application/x-rar-compressed',
	};

	return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
