/**
 * @file albums.types.ts
 * @module server/routes/albums/types
 * @description Tipos e interfaces para rutas de albums
 */

import type { AlbumWithStats } from '@/types/entities/album';

/**
 * Datos del album para tarjeta de UI
 */
export interface AlbumCardData extends Omit<AlbumWithStats, 'filters' | 'metadata'> {
	recentImages?: string[];
	recentVideos?: string[];
	totalSize: number;
	filters?: unknown[] | string;
	metadata?: {
		itemCount?: number;
		imageCount?: number;
		videoCount?: number;
		coverImageUrl?: string | null;
		thumbnailUrls?: string[];
		lastModified?: Date | string;
		entitiesCount?: number;
	} | null;
	viewConfig?: {
		theme?: string;
		layout?: string;
		thumbnailSize?: 'none' | 'small' | 'medium' | 'large';
	};
}

/**
 * Imagen thumbnail para previews
 */
export interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

/**
 * Estadísticas de un album
 */
export interface AlbumStats {
	imageCount: number;
	videoCount: number;
	totalSize: number;
	entitiesCount: number;
}
