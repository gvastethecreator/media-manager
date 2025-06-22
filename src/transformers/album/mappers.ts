/**
 * @file Mappers para la entidad Album.
 * @module transformers/album/mappers
 * @description Contiene funciones para transformar datos de la entidad Album.
 */
import type { AlbumStatistics, AlbumWithStats } from '@/types/entities/album';
import type { Album } from '@prisma/client';

/**
 * Representa la estructura del objeto de agregación de conteos de Prisma para un Album.
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
 * Convierte un objeto Album de Prisma y sus conteos a un objeto canónico AlbumWithStats.
 *
 * @param album El objeto Album de Prisma.
 * @param counts Los conteos de las relaciones del álbum.
 * @returns Un objeto AlbumWithStats.
 */
export function toAlbumWithStats(
	album: Album,
	counts: AlbumCounts['_count'],
): AlbumWithStats {
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
