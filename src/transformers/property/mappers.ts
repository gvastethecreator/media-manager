/**
 * @file Mappers para la entidad Property.
 * @module transformers/property/mappers
 * @description Contiene funciones para transformar datos de la entidad Property.
 */

import { calculateCompleteness } from '@/lib/utils/transformers';
import { PropertyStatistics, PropertyWithCounts, PropertyWithStats } from '@/types/entities/property';

/**
 
 *
 * @param drizzleProperty El objeto Property de Drizzle, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto PropertyWithStats con las estadísticas calculadas.
 */
export function toPropertyWithStats(propertyWithCounts: PropertyWithCounts): PropertyWithStats {
	const { _count, ...baseProperty } = propertyWithCounts;

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
		_count,
		stats,
	};
}
