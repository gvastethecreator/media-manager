/**
 * @file Client-safe helpers para thumbnails de video
 * @module utils/video/thumbnail-helpers
 * @description Este archivo solo contiene funciones seguras para el cliente
 */

import type { VideoBase } from '@/types/entities/video';

/**
 * Genera una URL para la miniatura de un video
 * @param video Objeto de video o ID
 * @param width Ancho opcional de la miniatura
 * @param height Alto opcional de la miniatura
 * @param timestamp Tiempo en segundos para extraer el frame (opcional)
 * @returns URL para la miniatura
 */
export function generateVideoThumbnailUrl(
	video: VideoBase | string,
	width?: number,
	height?: number,
	timestamp?: number
): string {
	const videoId = typeof video === 'string' ? video : video.id;
	const url = `/api/videos/${videoId}/thumbnail`;

	// Añadir parámetros
	const params = new URLSearchParams();
	if (width) {
		params.append('width', width.toString());
	}
	if (height) {
		params.append('height', height.toString());
	}
	if (timestamp !== undefined) {
		params.append('timestamp', timestamp.toString());
	}

	const queryString = params.toString();
	return queryString ? `${url}?${queryString}` : url;
}
