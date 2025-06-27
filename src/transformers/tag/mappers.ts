/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.
 */

import { PrismaTagWithCounts, TagStatistics, TagWithStats } from '@/types/entities/tag';
import { calculateCompleteness } from '@/lib/utils/transformers';

/**
 * Convierte un objeto Tag de Prisma (con conteos) a un objeto TagWithStats.
 *
 * @param prismaTag El objeto Tag de Prisma, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto TagWithStats con las estadísticas calculadas.
 */
export function toTagWithStats(prismaTag: PrismaTagWithCounts): TagWithStats {
	const { _count, ...baseTag } = prismaTag;

	// 1. Calcular el total de relaciones
	const totalRelations = Object.values(_count).reduce((sum, count) => sum + count, 0);

	// 2. Calcular la diversidad de uso
	const usageDiversity = Object.values(_count).filter((count) => count > 0).length;
	const totalPossibleRelations = Object.keys(_count).length;
	const diversityRatio = totalPossibleRelations > 0 ? usageDiversity / totalPossibleRelations : 0;

	// 3. Calcular la popularidad (fórmula simple por ahora)
	const popularity = Math.log1p(totalRelations) * diversityRatio;

	// 4. Calcular el puntaje de completitud
	const completenessScore = calculateCompleteness(baseTag, ['name', 'description', 'category']);

	const stats: TagStatistics = {
		totalRelations,
		usageDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
		popularity: Number.parseFloat(popularity.toFixed(2)),
		completenessScore,
	};

	return {
		...baseTag,
		stats,
	};
}
