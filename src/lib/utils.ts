import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EntityStats } from '@/types/entities/entity.types';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Formats a duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:23", "1:23:45")
 */
export function formatDuration(seconds: number): string {
	if (seconds < 0) {
		return '0:00';
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats a file size in bytes to a human-readable string.
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.23 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Creates a complete EntityStats object with default values.
 * @param overrides - Partial EntityStats to override defaults
 * @returns Complete EntityStats object
 */
export function createDefaultEntityStats(overrides: Partial<EntityStats> = {}): EntityStats {
	const now = new Date();
	return {
		// Conteos de relaciones
		imageCount: 0,
		videoCount: 0,
		albumCount: 0,
		collectionCount: 0,
		tagCount: 0,
		characterCount: 0,
		placeCount: 0,
		worldItemCount: 0,
		conceptCount: 0,
		promptCount: 0,
		noteCount: 0,
		wildcardCount: 0,
		propertyCount: 0,
		groupCount: 0,

		// Métricas globales
		totalItems: 0,
		totalAssociations: 0,

		// Timestamps
		lastUpdated: now,
		lastViewed: now,
		lastModified: now,

		// Métricas de uso
		viewCount: 0,
		downloadCount: 0,
		likeCount: 0,
		commentCount: 0,

		// Métricas de calidad
		qualityScore: 0,
		completenessScore: 0,

		// Estado
		isDuplicate: false,
		isOrphaned: false,
		needsAttention: false,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: now,
		birthtime: now,
		type: 'file',

		// Aplicar overrides
		...overrides,
	};
}
