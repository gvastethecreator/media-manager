/**
 * @file Mappers para la entidad Album.
 * @module transformers/album/mappers
 * @description Contiene funciones para transformar datos de la entidad Album.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { Album, AlbumStatistics, AlbumWithStats } from '@/types/entities/album';

/**
 * Representa la estructura del objeto de agregación de conteos para un Album.
 */
type AlbumCounts = {
	_count: {
		images: number;
		videos: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
	};
};

/**
 * Convierte un objeto Album y sus conteos a un objeto canónico AlbumWithStats.
 *
 * @param album El objeto Album.
 * @param counts Los conteos de las relaciones del álbum.
 * @returns Un objeto AlbumWithStats.
 */
export function toAlbumWithStats(album: Album, counts: AlbumCounts['_count']): AlbumWithStats {
	const stats: AlbumStatistics = {
		imageCount: counts.images,
		videoCount: counts.videos,
		collectionCount: counts.collections,
		tagCount: counts.tags,
		characterCount: counts.characters,
		placeCount: counts.places,
		worldItemCount: counts.worldItems,
		conceptCount: counts.concepts,
		promptCount: counts.prompts,
		noteCount: counts.notes,
		wildcardCount: counts.wildcards,
		propertyCount: counts.properties,
		groupCount: counts.groups,
	};

	return {
		...album,
		stats,
	};
}
