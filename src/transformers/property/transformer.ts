/**
 * @file Transformadores para la entidad Property.
 * @module transformers/property/transformer
 * @description Contiene funciones para convertir objetos Property entre diferentes formatos.
 */

import { createDefaultEntityStats } from '@/lib/utils';
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
				...createDefaultEntityStats(),
				imageCount: _count.images || 0,
				videoCount: _count.videos || 0,
				albumCount: _count.albums || 0,
				collectionCount: _count.collections || 0,
				tagCount: _count.tags || 0,
				characterCount: _count.characters || 0,
				placeCount: _count.places || 0,
				worldItemCount: _count.worldItems || 0,
				conceptCount: _count.concepts || 0,
				promptCount: _count.prompts || 0,
				noteCount: _count.notes || 0,
				wildcardCount: _count.wildcards || 0,
				propertyCount: 0,
				groupCount: _count.groups || 0,
				totalItems: 0,
				totalAssociations: totalRelations,
				totalRelations,
				popularity: Number.parseFloat(popularity.toFixed(2)),
				completenessScore,
				lastUpdated: baseProperty.updatedAt || new Date(),
				isDirectory: false,
				isFile: true,
			} as PropertyStatistics;
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
			...createDefaultEntityStats(),
			imageCount: 0,
			videoCount: 0,
			albumCount: 0,
			collectionCount: 0,
			tagCount: 0,
			characterCount: 0,
			placeCount: 0,
			worldItemCount: 0,
			conceptCount: 0,
			promptCount: 0,
			noteCount: 0,
			wildcardCount: 0,
			propertyCount: 0,
			groupCount: 0,
			totalItems: 0,
			totalAssociations: 0,
			totalRelations: 0,
			popularity: 0,
			completenessScore,
			lastUpdated: drizzleProperty.updatedAt || new Date(),
			isDirectory: false,
			isFile: true,
		} as PropertyStatistics;

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
