/**
 * @file Mappers para la entidad Property.
 * @module transformers/property/mappers
 * @description Contiene funciones para transformar datos de la entidad Property.
 */

import { createDefaultEntityStats } from '@/lib/utils';
import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';
import { normalizeCounts } from '../common/counts';
import type { PropertyStatistics, PropertyWithCounts, PropertyWithStats } from '../../types/entities/property';

/**

 *
 * @param drizzleProperty El objeto Property de Drizzle, incluyendo los `_count` de sus relaciones.
 * @returns Un objeto PropertyWithStats con las estadísticas calculadas.
 */
export function toPropertyWithStats(propertyWithCounts: PropertyWithCounts | PropertyWithStats): PropertyWithStats {
	const { _count, ...baseProperty } = propertyWithCounts;

	const counts = normalizeCounts(_count);

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
		...createDefaultEntityStats({
			tagCount: counts.tags,
			noteCount: counts.notes,
			collectionCount: counts.collections,
			albumCount: counts.albums,
			imageCount: counts.images,
			videoCount: counts.videos,
			characterCount: counts.characters,
			placeCount: counts.places,
			conceptCount: counts.concepts,
			promptCount: counts.prompts,
			wildcardCount: counts.wildcards,
			groupCount: counts.groups,
			propertyCount: 1,
			totalItems: totalRelations,
			type: 'property',
		}),
		totalRelations,
		totalAssociations: totalRelations,
		valueDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
		usageCount: totalRelations,
		popularity: Number.parseFloat(popularity.toFixed(2)),
		completenessScore,
		isDirectory: false,
		isFile: true,
	};

	return {
		...baseProperty,
		entityType: 'property',
		statistics,
		stats: statistics,
		_count: counts,
	};
}
