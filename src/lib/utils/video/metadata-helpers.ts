/**
 * @file Helpers para metadata y calidad de video
 * @module utils/video/metadata-helpers
 */

import type { z } from 'zod';
import type { VideoBase } from '@/types/entities/video';
import type { VideoMetadataSchema } from '@/types/entities/video/schema';

type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

/**
 * Determina si un video es de alta definición
 * @param height Alto del video en píxeles
 * @returns true si es HD o superior
 */
export function isHDVideo(height?: number): boolean {
	if (!height) {
		return false;
	}
	return height >= 720;
}

/**
 * Obtiene la calidad del video en texto
 * @param height Alto del video en píxeles
 * @returns Etiqueta de calidad
 */
export function getVideoQualityLabel(height?: number): string {
	if (!height) {
		return 'Desconocido';
	}

	if (height >= 2160) {
		return '4K UHD';
	}
	if (height >= 1440) {
		return '2K QHD';
	}
	if (height >= 1080) {
		return 'Full HD';
	}
	if (height >= 720) {
		return 'HD';
	}
	if (height >= 480) {
		return 'SD';
	}
	return 'Baja resolución';
}

/**
 * Extrae palabras clave de los metadatos del video para sugerir etiquetas
 * @param metadata Metadatos del video
 * @returns Array de etiquetas sugeridas
 */
export function extractVideoTagSuggestions(metadata?: VideoMetadata): string[] {
	if (!metadata) {
		return [];
	}

	const suggestions: string[] = [];

	// Sugerir en base a la calidad
	if (metadata.height) {
		suggestions.push(getVideoQualityLabel(metadata.height));
	}

	// Sugerir en base a la duración
	if (metadata.duration) {
		if (metadata.duration < 60) {
			suggestions.push('Clip corto');
		} else if (metadata.duration < 600) {
			suggestions.push('Video corto');
		} else if (metadata.duration > 1800) {
			suggestions.push('Video largo');
		}
	}

	// Añadir formato como sugerencia
	if (metadata.format) {
		suggestions.push(metadata.format.toUpperCase());
	}

	return suggestions;
}

/**
 * Comprueba si un video tiene metadatos completos
 * @param video Objeto de video
 * @returns true si tiene metadatos completos
 */
export function hasCompleteMetadata(video: VideoBase): boolean {
	if (!video.metadata) {
		return false;
	}

	const metadata: VideoMetadata = typeof video.metadata === 'string' ? JSON.parse(video.metadata) : video.metadata;

	const { width, height, duration, format, size } = metadata;
	return !!(width && height && duration && format && size);
}
