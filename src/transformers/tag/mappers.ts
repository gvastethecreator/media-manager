/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.

 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { TagBase, TagStatistics, TagWithStats } from '@/types/entities/tag';
import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';

/**
 * Mapea un tag de la base de datos a TagWithStats
 */
function computeTagStats(
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
): TagStatistics {
	const counts = baseTag._count ?? {};
	const countValues = Object.values(counts) as number[];
	const totalRelations = countValues.reduce((sum, n) => sum + (n || 0), 0);
	const usageDiversity = countValues.filter((n) => (n || 0) > 0).length;
	const denominator = Math.max(Object.keys(counts).length || 0, 1);
	const popularity = totalRelations * (usageDiversity / denominator);

	// Evitar cast inseguro: construir un shape mínimo para evaluar completitud
	const completenessInput = {
		name: baseTag.name,
		description: baseTag.description,
		category: baseTag.category,
	} as Record<string, unknown>;
	const completenessScore = calculateCompleteness(completenessInput, ['name', 'description', 'category']);

	return {
		...createDefaultEntityStats({ type: 'tag' }),
		imageCount: counts.images || 0,
		videoCount: counts.videos || 0,
		albumCount: counts.albums || 0,
		collectionCount: counts.collections || 0,
		characterCount: counts.characters || 0,
		placeCount: counts.places || 0,
		worldItemCount: counts.worldItems || 0,
		conceptCount: counts.concepts || 0,
		promptCount: counts.prompts || 0,
		noteCount: counts.notes || 0,
		wildcardCount: counts.wildcards || 0,
		propertyCount: counts.properties || 0,
		groupCount: counts.groups || 0,
		tagCount: 1,
		totalItems: totalRelations,
		totalAssociations: totalRelations,
		lastUpdated: new Date(),
		totalRelations,
		usageDiversity,
		popularity,
		completenessScore,
	};
}

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
	const statistics: TagStatistics = computeTagStats(baseTag);

	return {
		...baseTag,
		entityType: 'tag',
		stats: statistics,
		statistics,
		_count: baseTag._count || {},
	};
}
