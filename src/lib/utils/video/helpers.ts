/**
 * @file Funciones auxiliares para el manejo de videos
 * @module utils/video/helpers
 */

import { z } from 'zod';
import { formatBytes } from '@/lib/utils/format.utils';
import { type VideoBase } from '@/types/entities/video';
import { VideoFormat } from '@/types/entities/video/enums';
import { VideoMetadataSchema } from '@/types/entities/video/schema';

type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

/**
 * Formatea la duración de un video en segundos a formato legible
 * @param durationSeconds Duración en segundos
 * @returns Duración formateada como HH:MM:SS o MM:SS
 */
export function formatVideoDuration(durationSeconds?: number): string {
	if (!durationSeconds) return '00:00';

	const hours = Math.floor(durationSeconds / 3600);
	const minutes = Math.floor((durationSeconds % 3600) / 60);
	const seconds = Math.floor(durationSeconds % 60);

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

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
	if (width) params.append('width', width.toString());
	if (height) params.append('height', height.toString());
	if (timestamp !== undefined) params.append('timestamp', timestamp.toString());

	const queryString = params.toString();
	return queryString ? `${url}?${queryString}` : url;
}

/**
 * Formatea el tamaño de un video
 * @param metadata Metadatos del video
 * @returns Tamaño formateado
 */
export function formatVideoSize(metadata?: VideoMetadata): string {
	if (!metadata || metadata.size === undefined) return 'Desconocido';
	return formatBytes(metadata.size);
}

/**
 * Formatea las dimensiones de un video
 * @param width Ancho del video
 * @param height Alto del video
 * @returns Dimensiones formateadas
 */
export function formatVideoDimensions(width?: number, height?: number): string {
	if (!(width && height)) return 'Desconocido';
	return `${width} × ${height}`;
}

/**
 * Obtiene un string descriptivo para el formato de video
 * @param format Formato del video
 * @returns Descripción en español
 */
export function getVideoFormatDescription(format?: VideoFormat): string {
	if (!format) return 'Desconocido';

	switch (format) {
		case VideoFormat.MP4:
			return 'MP4 (H.264)';
		case VideoFormat.MOV:
			return 'QuickTime (MOV)';
		case VideoFormat.AVI:
			return 'AVI';
		case VideoFormat.WMV:
			return 'Windows Media';
		case VideoFormat.MKV:
			return 'Matroska';
		case VideoFormat.WEBM:
			return 'WebM';
		case VideoFormat.FLV:
			return 'Flash Video';
		default:
			return format ? (format as string).toUpperCase() : 'Desconocido';
	}
}

/**
 * Calcula el bitrate aproximado a partir del tamaño y duración
 * @param size Tamaño en bytes
 * @param durationSeconds Duración en segundos
 * @returns Bitrate formateado o undefined
 */
export function calculateBitrate(size?: number, durationSeconds?: number): string | undefined {
	if (!(size && durationSeconds)) return;

	// Bitrate en kilobits por segundo (kbps)
	const bitrateKbps = (size * 8) / (durationSeconds * 1000);

	if (bitrateKbps >= 1000) {
		return `${(bitrateKbps / 1000).toFixed(2)} Mbps`;
	}

	return `${Math.round(bitrateKbps)} kbps`;
}

/**
 * Determina si un video es de alta definición
 * @param height Alto del video en píxeles
 * @returns true si es HD o superior
 */
export function isHDVideo(height?: number): boolean {
	if (!height) return false;
	return height >= 720;
}

/**
 * Obtiene la calidad del video en texto
 * @param height Alto del video en píxeles
 * @returns Etiqueta de calidad
 */
export function getVideoQualityLabel(height?: number): string {
	if (!height) return 'Desconocido';

	if (height >= 2160) return '4K UHD';
	if (height >= 1440) return '2K QHD';
	if (height >= 1080) return 'Full HD';
	if (height >= 720) return 'HD';
	if (height >= 480) return 'SD';
	return 'Baja resolución';
}

/**
 * Extrae palabras clave de los metadatos del video para sugerir etiquetas
 * @param metadata Metadatos del video
 * @returns Array de etiquetas sugeridas
 */
export function extractVideoTagSuggestions(metadata?: VideoMetadata): string[] {
	if (!metadata) return [];

	const suggestions: string[] = [];

	// Sugerir en base a la calidad
	if (metadata.height) {
		suggestions.push(getVideoQualityLabel(metadata.height));
	}

	// Sugerir en base a la duración
	if (metadata.duration) {
		if (metadata.duration < 60) suggestions.push('Clip corto');
		else if (metadata.duration < 600) suggestions.push('Video corto');
		else if (metadata.duration > 1800) suggestions.push('Video largo');
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
	if (!video.metadata) return false;

	const metadata: VideoMetadata = typeof video.metadata === 'string' ? JSON.parse(video.metadata) : video.metadata;

	const { width, height, duration, format, size } = metadata;
	return !!(width && height && duration && format && size);
}

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

/**
 * Obtiene un objeto con los valores predeterminados para la configuración visual de un video
 * @returns Configuración visual con valores predeterminados
 */
export function getDefaultVideoVisualConfig(): Omit<Record<string, any>, 'id' | 'videoId'> {
	return {
		enable3DEffect: true,
		designSystem: 'default_design_system',
		enableHolographicEffect: true,
		enableGlowEffect: true,
		enableAnimatedBorder: true,
		enableLightHalo: true,
		layerSystem: '{"version":"1.0","layers":[]}',
		effects: '{"enabled":true,"list":[]}',
		performance: '{"mode":"balanced","cache":true,"preload":true}',
		states: '{"hover":true,"active":true,"focus":true}',
	};
}

/**
 * Verifica si hay cambios significativos entre dos configuraciones visuales
 * @param configA Primera configuración
 * @param configB Segunda configuración
 * @returns true si hay diferencias importantes
 */
export function hasVisualConfigChanged(
	configA?: Partial<Record<string, any>>,
	configB?: Partial<Record<string, any>>
): boolean {
	if (!(configA && configB)) return true;

	const keysToCompare = [
		'enable3DEffect',
		'enableHolographicEffect',
		'enableGlowEffect',
		'enableAnimatedBorder',
		'enableLightHalo',
		'designSystem',
		'layerSystem',
		'effects',
		'performance',
		'states',
	];

	for (const key of keysToCompare) {
		// Comparación especial para campos JSON almacenados como string
		if (['layerSystem', 'effects', 'performance', 'states'].includes(key)) {
			// Si alguno está definido como objeto y el otro como string, se consideran diferentes
			const typeA = typeof configA[key];
			const typeB = typeof configB[key];

			if (typeA !== typeB) return true;

			// Si ambos son string, comparar como JSON
			if (typeA === 'string' && typeB === 'string') {
				try {
					const objA = JSON.parse(configA[key] as string);
					const objB = JSON.parse(configB[key] as string);
					// Comparación simple de estructuras JSON
					if (JSON.stringify(objA) !== JSON.stringify(objB)) return true;
				} catch (_e) {
					// Si falla el parse, comparar como strings
					if (configA[key] !== configB[key]) return true;
				}
			}
			// Si son objetos, comparar directamente
			else if (configA[key] !== configB[key]) return true;
		}
		// Para campos simples, comparación directa
		else if (configA[key] !== configB[key]) return true;
	}

	return false;
}
