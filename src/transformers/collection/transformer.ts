/**
 * @file Transformador principal para la entidad Collection
 * @module transformers/collection/transformer
 * @description Contiene la lógica para convertir un objeto Collection de Drizzle a nuestro tipo canónico.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionBase, CollectionStatistics, CollectionWithStats } from '@/types/entities/collection';

const logger = serverLogger.withContext('CollectionTransformer');

/**
 * 🔄 Transforma un objeto Collection de Drizzle con conteos a nuestro tipo canónico CollectionWithStats.
 *
 * @param drizzleCollection - El objeto Collection base obtenido de Drizzle.
 * @param counts - Los conteos de las relaciones de la colección.
 * @returns Un objeto CollectionWithStats compatible con nuestra aplicación, o null.
 */
export function fromDrizzleCollection(
	drizzleCollection: CollectionBase | null,
	counts: {
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
	}
): CollectionWithStats | null {
	if (!drizzleCollection) {
		return null;
	}

	try {
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
			...drizzleCollection,
			entityType: 'collection' as const,
			stats,
		};
	} catch (error) {
		logger.error('Error transformando colección desde Drizzle', {
			error,
			collectionId: drizzleCollection?.id,
		});
		return null;
	}
}

/**
 * 🔄 Transforma una lista de colecciones de Drizzle a una lista de CollectionWithStats.
 *
 * @param drizzleCollections - Un array de objetos Collection de Drizzle con sus conteos.
 * @returns Un array de objetos CollectionWithStats.
 */
export function fromDrizzleCollections(
	drizzleCollections: Array<{
		collection: CollectionBase;
		counts: {
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
	}>
): CollectionWithStats[] {
	return drizzleCollections
		.map(({ collection, counts }) => fromDrizzleCollection(collection, counts))
		.filter((c): c is CollectionWithStats => c !== null);
}
