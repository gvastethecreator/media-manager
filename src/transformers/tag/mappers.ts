/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.
 
 */

import { calculateCompleteness } from '../../lib/utils/stats';
import type { TagBase, TagStatistics, TagWithStats } from '../../types/entities/tag';

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
	const countValues = Object.values(_count) as number[];
	const totalRelations = countValues.reduce((sum: number, count: number) => sum + count, 0);
	const usageDiversity = countValues.filter((count: number) => count > 0).length;
	const popularity = totalRelations * (usageDiversity / Object.keys(_count).length);
	const completenessScore = calculateCompleteness(baseTag);

	const stats: TagStatistics = {
		imageCount: _count.images,
		videoCount: _count.videos,
		albumCount: _count.albums,
		collectionCount: _count.collections,
		characterCount: _count.characters,
		placeCount: _count.places,
		worldItemCount: _count.worldItems,
		conceptCount: _count.concepts,
		promptCount: _count.prompts,
		noteCount: _count.notes,
		wildcardCount: _count.wildcards,
		propertyCount: _count.properties,
		groupCount: _count.groups,
		totalRelations,
		usageDiversity,
		popularity,
		completenessScore,
	};

	return {
		...baseTag,
		entityType: 'tag',
		stats,
		_count,
	};
}
