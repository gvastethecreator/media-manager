/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.

 */

import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';
import type { TagBase, TagWithStats, TagStatistics } from '@/types/entities/tag';
import type { EntityWithStats } from '@/types/entities/entity.types';
import { createDefaultEntityStats } from '@/lib/utils';

/**
 * Mapea un tag de la base de datos a TagWithStats
 */
export function toTagWithStats(
	baseTag: TagBase & {
		_count?: {
			images?: number;
			videos?: number;
			albums?: number;
			collections?: number;
			characters?: number;
			places?: number;
			worldItems?: number;
			concepts?: number;
			prompts?: number;
			notes?: number;
			wildcards?: number;
			properties?: number;
			groups?: number;
		};
	}
): TagWithStats {
	const { _count } = baseTag;

	// Calcular estadísticas basadas en los conteos
	const countValues = Object.values(_count || {}) as number[];
	const totalRelations = countValues.reduce((sum: number, count: number) => sum + (count || 0), 0);
	const usageDiversity = countValues.filter((count: number) => (count || 0) > 0).length;
	const popularity = totalRelations * (usageDiversity / Math.max(Object.keys(_count || {}).length, 1));
	const completenessScore = calculateCompleteness(baseTag as Record<string, unknown>, ['name', 'description', 'category']);

	const statistics: TagStatistics = {
		...createDefaultEntityStats(),
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
		tagCount: 1, // Es un tag individual
		totalItems: totalRelations,
		totalAssociations: totalRelations,
		lastUpdated: new Date(),
		// Propiedades específicas de Tag
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
