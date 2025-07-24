/**
 * @file Mappers para la entidad Collection.
 * @module transformers/collection/mappers
 * @description Contiene funciones para transformar datos de la entidad Collection.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import { calculateCompleteness } from '@/lib/utils/transformers';
import type { CollectionBase, CollectionWithStats } from '@/types/entities/collection';

/**
 * Convierte un CollectionBase a CollectionWithStats calculando estadísticas.
 * @param collection - Datos base de la colección
 * @param counts - Conteos de relaciones (opcional)
 * @returns CollectionWithStats
 */
export function toCollectionWithStats(collection: CollectionBase, counts?: any): CollectionWithStats {
	// Calcular estadísticas básicas
	const totalItems = counts ? Object.values(counts).reduce((sum: number, count: any) => sum + (count || 0), 0) : 0;
	const imageCount = counts?.images || 0;
	const videoCount = counts?.videos || 0;

	const stats = {
		totalItems,
		imageCount,
		videoCount,
		totalValue: 0,
		lastActivity: new Date(),
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
