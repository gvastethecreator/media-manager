/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.
 
 */

import { calculateCompleteness } from '@/lib/utils/transformers';
import { TagStats, TagWithCounts, TagWithStats } from '@/types/entities/tag';

/**
 * Convierte un objeto Tag de Drizzle (con conteos) a un objeto TagWithStats.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param tagWithCounts El objeto Tag de Drizzle, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto TagWithStats con las estadísticas calculadas.
 */
export function toTagWithStats(tagWithCounts: TagWithCounts): TagWithStats {
	const { _count, ...baseTag } = tagWithCounts;

	return {
		...baseTag,
		_count,
	};
}
