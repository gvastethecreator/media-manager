/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.
 
 */

import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';
import type { TagStatistics, TagWithCounts, TagWithStats } from '../../types/entities/tag';

/**
 * Convierte un objeto Tag de Drizzle (con conteos) a un objeto TagWithStats.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param tagWithCounts El objeto Tag de Drizzle, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto TagWithStats con las estadísticas calculadas.
 */
export function toTagWithStats(tagWithCounts: TagWithCounts): TagWithStats {
	const { _count, ...baseTag } = tagWithCounts;

	// Calcular estadísticas basadas en los conteos
	const countValues = Object.values(_count || {}) as number[];
	const totalRelations = countValues.reduce((sum: number, count: number) => sum + (count || 0), 0);
	const usageDiversity = countValues.filter((count: number) => (count || 0) > 0).length;
	const popularity = totalRelations * (usageDiversity / Math.max(Object.keys(_count || {}).length, 1));
	const completenessScore = calculateCompleteness(baseTag);

	const statistics: TagStatistics = {
		imageCount: _count?.images || 0,
		videoCount: _count?.videos || 0,
		albumCount: _count?.albums || 0,
		collectionCount: _count?.collections || 0,
		characterCount: _count?.characters || 0,
		placeCount: _count?.places || 0,
		worldItemCount: _count?.worldItems || 0,
		conceptCount: _count?.concepts || 0,
		promptCount: _count?.prompts || 0,
		noteCount: _count?.notes || 0,
		wildcardCount: _count?.wildcards || 0,
		propertyCount: _count?.properties || 0,
		groupCount: _count?.groups || 0,
		totalRelations,
		usageDiversity,
		popularity,
		completenessScore,
	};

	return {
		...baseTag,
		entityType: 'tag',
		statistics,
		stats: statistics,
		_count: _count || {},
	};
}
