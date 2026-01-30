/**
 * @file Formatters para diferentes tipos de datos
 * @module lib/utils/formatters
 */

import { formatBytes, formatDate, formatNumber, formatPercentage, formatRelativeTime } from './format.utils';

// Re-exportar formatters básicos
export { formatBytes, formatDate, formatRelativeTime, formatNumber, formatPercentage };

/**
 * Formatea información de thumbnail
 */
export function formatThumbnailInfo(width?: number, height?: number, size?: number): string {
	const parts: string[] = [];

	if (width && height) {
		parts.push(`${width}x${height}`);
	}

	if (size) {
		parts.push(formatBytes(size));
	}

	return parts.join(' • ');
}

/**
 * Formatea información de imagen
 */
export function formatImageInfo(width?: number, height?: number, size?: number, format?: string): string {
	const parts: string[] = [];

	if (width && height) {
		parts.push(`${width}x${height}`);
	}

	if (format) {
		parts.push(format.toUpperCase());
	}

	if (size) {
		parts.push(formatBytes(size));
	}

	return parts.join(' • ');
}

/**
 * Formatea un path de archivo para mostrar
 */
export function formatPath(path: string, maxLength = 50): string {
	if (path.length <= maxLength) {
		return path;
	}

	const parts = path.split(/[/\\]/);
	if (parts.length <= 2) {
		return path;
	}

	const fileName = parts.at(-1);
	const firstDir = parts[0];

	return `${firstDir}/.../${fileName}`;
}

/**
 * Formatea el estado de un proceso
 */
export function formatProcessStatus(processed: number, total: number, errors = 0): string {
	const percentage = formatPercentage(processed, total);
	const errorText = errors > 0 ? ` (${errors} errores)` : '';

	return `${processed}/${total} (${percentage})${errorText}`;
}

/**
 * Formatea tags para mostrar
 */
export function formatTags(tags: string[], maxTags = 3): string {
	if (tags.length === 0) {
		return 'Sin tags';
	}

	if (tags.length <= maxTags) {
		return tags.join(', ');
	}

	const visibleTags = tags.slice(0, maxTags);
	const remainingCount = tags.length - maxTags;

	return `${visibleTags.join(', ')} +${remainingCount} más`;
}
