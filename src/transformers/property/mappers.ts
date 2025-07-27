/**
 * @file Mappers para la entidad Property.
 * @module transformers/property/mappers
 * @description Contiene funciones para transformar datos de la entidad Property.
 */

import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';
import type { PropertyStatistics, PropertyWithCounts, PropertyWithStats } from '../../types/entities/property';

/**
 
 *
 * @param drizzleProperty El objeto Property de Drizzle, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto PropertyWithStats con las estadísticas calculadas.
 */
export function toPropertyWithStats(propertyWithCounts: PropertyWithCounts | PropertyWithStats): PropertyWithStats {
	const { _count, ...baseProperty } = propertyWithCounts;

	// Manejar el caso donde _count puede ser undefined
	const counts = _count || {
		images: 0,
		videos: 0,
		albums: 0,
		collections: 0,
		tags: 0,
		characters: 0,
		places: 0,
		worldItems: 0,
		concepts: 0,
		prompts: 0,
		notes: 0,
		wildcards: 0,
		groups: 0,
	};

	// 1. Calcular el total de relaciones
	const totalRelations = Object.values(counts).reduce((sum, count) => sum + count, 0);

	// 2. Calcular la diversidad de uso
	const usageDiversity = Object.values(counts).filter((count) => count > 0).length;
	const totalPossibleRelations = Object.keys(counts).length;
	const diversityRatio = totalPossibleRelations > 0 ? usageDiversity / totalPossibleRelations : 0;

	// 3. Calcular la popularidad (fórmula simple por ahora)
	const popularity = Math.log1p(totalRelations) * diversityRatio;

	// 4. Calcular el puntaje de completitud
	const completenessScore = calculateCompleteness(baseProperty, ['name', 'description', 'category']);

	const statistics: PropertyStatistics = {
		totalRelations,
		totalAssociations: totalRelations,
		usageDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
		popularity: Number.parseFloat(popularity.toFixed(2)),
		completenessScore,
	};

	return {
		...baseProperty,
		entityType: 'property',
		statistics,
		stats: statistics,
		_count: counts,
	};
}
