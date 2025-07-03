/**
 * @file Mappers para la entidad Property.
 * @module transformers/property/mappers
 * @description Contiene funciones para transformar datos de la entidad Property.
 */

import { calculateCompleteness } from '@/lib/utils/transformers';
import { PrismaPropertyWithCounts, PropertyStatistics, PropertyWithStats } from '@/types/entities/property';

/**
 * Convierte un objeto Property de Prisma (con conteos) a un objeto PropertyWithStats.
 *
 * @param prismaProperty El objeto Property de Prisma, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto PropertyWithStats con las estadísticas calculadas.
 */
export function toPropertyWithStats(prismaProperty: PrismaPropertyWithCounts): PropertyWithStats {
	const { _count, ...baseProperty } = prismaProperty;

	// 1. Calcular el total de relaciones
	const totalRelations = Object.values(_count).reduce((sum, count) => sum + count, 0);

	// 2. Calcular la diversidad de uso
	const usageDiversity = Object.values(_count).filter((count) => count > 0).length;
	const totalPossibleRelations = Object.keys(_count).length;
	const diversityRatio = totalPossibleRelations > 0 ? usageDiversity / totalPossibleRelations : 0;

	// 3. Calcular la popularidad (fórmula simple por ahora)
	const popularity = Math.log1p(totalRelations) * diversityRatio;

	// 4. Calcular el puntaje de completitud
	const completenessScore = calculateCompleteness(baseProperty, ['name', 'description', 'category']);

	const stats: PropertyStatistics = {
		totalRelations,
		usageDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
		popularity: Number.parseFloat(popularity.toFixed(2)),
		completenessScore,
	};

	return {
		...baseProperty,
		stats,
	};
}
