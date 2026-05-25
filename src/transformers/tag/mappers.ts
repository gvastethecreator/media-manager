/**
 * @file Mappers para la entidad Tag.
 * @module transformers/tag/mappers
 * @description Contiene funciones para transformar datos de la entidad Tag.

 */

import { createDefaultEntityStats } from '@/lib/utils';
import type { TagBase, TagStatistics, TagWithStats } from '@/types/entities/tag';
import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';
import { normalizeCounts, sumCounts } from '../common/counts';

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
	const counts = normalizeCounts(baseTag._count);
	const totalRelations = sumCounts(counts);
	const usageDiversity = Object.values(counts).filter((n) => n > 0).length;
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
		imageCount: counts.images,
		videoCount: counts.videos,
		albumCount: counts.albums,
		collectionCount: counts.collections,
		characterCount: counts.characters,
		placeCount: counts.places,
		worldItemCount: counts.worldItems,
		conceptCount: counts.concepts,
		promptCount: counts.prompts,
		noteCount: counts.notes,
		wildcardCount: counts.wildcards,
		propertyCount: counts.properties,
		groupCount: counts.groups,
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
