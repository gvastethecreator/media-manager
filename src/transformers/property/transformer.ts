/**
 * @file Transformadores para la entidad Property.
 * @module transformers/property/transformer
 * @description Contiene funciones para convertir objetos Property entre diferentes formatos.
 */

import { serverLogger } from '../../lib/logger/server-logger';
import { calculateCompleteness } from '../../lib/utils/stats';
import type { PropertyBase, PropertyStatistics, PropertyWithStats } from '../../types/entities/property';

const propertyTransformerLogger = serverLogger.withContext('PropertyTransformer');

/**
 * Convierte un objeto Property de Drizzle a PropertyWithStats.
 * Esta función es compatible con el sistema legacy que esperaba PropertyComplete.
 *
 * @param drizzleProperty El objeto Property de Drizzle, puede incluir conteos de relaciones
 * @returns Un objeto PropertyWithStats con estadísticas calculadas o null si el input es inválido
 */
export function fromDrizzleProperty(drizzleProperty: any | null): PropertyWithStats | null {
	if (!drizzleProperty) {
		propertyTransformerLogger.warn('⚠️ Property de Drizzle nulo o indefinido');
		return null;
	}

	try {
		propertyTransformerLogger.debug(`🔄 Transformando property: ${drizzleProperty.id}`);

		const hasCounts = '_count' in drizzleProperty && drizzleProperty._count;

		if (hasCounts) {
			const { _count, ...baseProperty } = drizzleProperty;

			const countValues = Object.values(_count) as number[];
			const totalRelations = countValues.reduce((sum: number, count: number) => sum + count, 0);
			const usageDiversity = countValues.filter((count: number) => count > 0).length;
			const totalPossibleRelations = Object.keys(_count).length;
			const diversityRatio = totalPossibleRelations > 0 ? usageDiversity / totalPossibleRelations : 0;
			const popularity = Math.log1p(totalRelations) * diversityRatio;
			const completenessScore = calculateCompleteness(baseProperty, ['name', 'description', 'category']);

			const stats: PropertyStatistics = {
				totalRelations,
				totalAssociations: totalRelations,
				usageDiversity: Number.parseFloat(diversityRatio.toFixed(2)),
				popularity: Number.parseFloat(popularity.toFixed(2)),
				completenessScore,
			};
			return {
				...baseProperty,
				entityType: 'property',
				statistics: stats,
				stats,
				_count: drizzleProperty._count,
			};
		}

		const completenessScore = calculateCompleteness(drizzleProperty, ['name', 'description', 'category']);

		const stats: PropertyStatistics = {
			totalRelations: 0,
			totalAssociations: 0,
			usageDiversity: 0,
			popularity: 0,
			completenessScore,
		};

		return {
			...(drizzleProperty as PropertyBase),
			entityType: 'property',
			statistics: stats,
			stats,
			_count: {
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
			},
		};
	} catch (error) {
		propertyTransformerLogger.error('❌ Error transformando property:', error);
		return null;
	}
}

export const PropertyTransformer = {
	fromDrizzleProperty,
} as const;

export const transformProperty = PropertyTransformer.fromDrizzleProperty;

export type PropertyComplete = PropertyWithStats;
