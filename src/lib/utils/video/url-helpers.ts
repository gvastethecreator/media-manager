/**
 * @file Helpers para URLs de video (streaming, download, thumbnail)
 * @module utils/video/url-helpers
 */

import type { VideoBase } from '@/types/entities/video';

/**
 * Genera URL para streaming de video con diferentes resoluciones
 * @param video Objeto de video o ID
 * @param quality Calidad deseada (auto, high, medium, low)
 * @returns URL para streaming
 */
export function generateVideoStreamUrl(
	video: VideoBase | string,
	quality: 'auto' | 'high' | 'medium' | 'low' = 'auto'
): string {
	const videoId = typeof video === 'string' ? video : video.id;
	let url = `/api/videos/${videoId}/stream`;

	if (quality !== 'auto') {
		url += `?quality=${quality}`;
	}

	return url;
}

/**
 * Obtiene la URL de un video para descargar
 * @param video Objeto de video o ID
 * @param filename Nombre opcional para el archivo
 * @returns URL para descarga
 */
export function generateVideoDownloadUrl(video: VideoBase | string, filename?: string): string {
	const videoId = typeof video === 'string' ? video : video.id;
	let url = `/api/videos/${videoId}/download`;

	if (filename) {
		url += `?filename=${encodeURIComponent(filename)}`;
	}

	return url;
}
