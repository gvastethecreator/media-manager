/**
 * @file Helpers para formato y presentación de datos de video
 * @module utils/video/format-helpers
 */

import type { z } from 'zod';
import { formatBytes } from '@/lib/utils/format.utils';
import { VideoFormat } from '@/types/entities/video/enums';
import type { VideoMetadataSchema } from '@/types/entities/video/schema';

type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

/**
 * Formatea la duración de un video en segundos a formato legible
 * @param durationSeconds Duración en segundos
 * @returns Duración formateada como HH:MM:SS o MM:SS
 */
export function formatVideoDuration(durationSeconds?: number): string {
	if (!durationSeconds) {
		return '00:00';
	}

	const hours = Math.floor(durationSeconds / 3600);
	const minutes = Math.floor((durationSeconds % 3600) / 60);
	const seconds = Math.floor(durationSeconds % 60);

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formatea el tamaño de un video
 * @param metadata Metadatos del video
 * @returns Tamaño formateado
 */
export function formatVideoSize(metadata?: VideoMetadata): string {
	if (!metadata || metadata.size === undefined) {
		return 'Desconocido';
	}
	return formatBytes(metadata.size);
}

/**
 * Formatea las dimensiones de un video
 * @param width Ancho del video
 * @param height Alto del video
 * @returns Dimensiones formateadas
 */
export function formatVideoDimensions(width?: number, height?: number): string {
	if (!(width && height)) {
		return 'Desconocido';
	}
	return `${width} × ${height}`;
}

/**
 * Obtiene un string descriptivo para el formato de video
 * @param format Formato del video
 * @returns Descripción en español
 */
export function getVideoFormatDescription(format?: VideoFormat): string {
	if (!format) {
		return 'Desconocido';
	}

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
	if (!(size && durationSeconds)) {
		return;
	}

	// Bitrate en kilobits por segundo (kbps)
	const bitrateKbps = (size * 8) / (durationSeconds * 1000);

	if (bitrateKbps >= 1000) {
		return `${(bitrateKbps / 1000).toFixed(2)} Mbps`;
	}

	return `${Math.round(bitrateKbps)} kbps`;
}
