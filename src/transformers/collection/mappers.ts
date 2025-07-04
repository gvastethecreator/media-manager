/**
 * @file Mappers para la entidad Collection.
 * @module transformers/collection/mappers
 * @description Contiene funciones para transformar datos de la entidad Collection.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import type { CollectionBase, CollectionStatistics, CollectionWithStats } from '@/types/entities/collection';

/**
 * Representa la estructura del objeto de agregación de conteos para una Collection (Drizzle).
 */
type CollectionCounts = {
	_count: {
		images: number;
		videos: number;
		albums: number;
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
 * Convierte un objeto Collection y sus conteos a un objeto canónico CollectionWithStats.
 *
 * @param collection El objeto Collection base.
 * @param counts Los conteos de las relaciones de la colección.
 * @returns Un objeto CollectionWithStats.
 */
export function toCollectionWithStats(collection: CollectionBase, counts: CollectionCounts['_count']): CollectionWithStats {
	const stats: CollectionStatistics = {
		imageCount: counts.images,
		videoCount: counts.videos,
		albumCount: counts.albums,
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
		...collection,
		stats,
	};
}
