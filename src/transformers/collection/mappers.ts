/**
 * @file Mappers para la entidad Collection.
 * @module transformers/collection/mappers
 * @description Contiene funciones para transformar datos de la entidad Collection.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import { calculateCompleteness } from '../../lib/utils/transformers';
import type { CollectionBase, CollectionWithStats } from '../../types/entities/collection';

/**
 * Convierte un CollectionBase a CollectionWithStats calculando estadísticas.
 * @param collection - Datos base de la colección
 * @param counts - Conteos de relaciones (opcional)
 * @returns CollectionWithStats
 */
export function toCollectionWithStats(
	collection: CollectionBase,
	counts?: Record<string, number>
): CollectionWithStats {
	// Calcular estadísticas básicas
	const imageCount = counts?.images || 0;
	const videoCount = counts?.videos || 0;

	const stats = {
		imageCount,
		videoCount,
		albumCount: counts?.albums || 0,
		tagCount: counts?.tags || 0,
		characterCount: counts?.characters || 0,
		placeCount: counts?.places || 0,
		worldItemCount: counts?.worldItems || 0,
		conceptCount: counts?.concepts || 0,
		promptCount: counts?.prompts || 0,
		noteCount: counts?.notes || 0,
		wildcardCount: counts?.wildcards || 0,
		propertyCount: counts?.properties || 0,
		groupCount: counts?.groups || 0,
	};

	return {
		...collection,
		entityType: 'collection' as const,
		stats,
	};
}

/**
 * Convierte una lista de CollectionBase a CollectionWithStats.
 * @param collections - Lista de colecciones base
 * @returns Lista de CollectionWithStats
 */
export function toCollectionWithStatsList(collections: CollectionBase[]): CollectionWithStats[] {
	return collections.map((collection) => toCollectionWithStats(collection));
}
