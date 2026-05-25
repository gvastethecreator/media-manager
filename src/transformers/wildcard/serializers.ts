/**
 * 🃏 WILDCARD SERIALIZERS
 *
 * Funciones de serialización para respuestas de API.
 *
 * @updated 2025-01-27
 */

import { WildcardBase, WildcardWithStats } from '../../types/entities/wildcard';
import { normalizeCounts } from '../common/counts';

/**
 * Serializa WildcardBase para respuestas de API
 */
export function serializeWildcard(wildcard: WildcardBase): Record<string, unknown> {
	return {
		id: wildcard.id,
		content: wildcard.content,
		type: wildcard.type,
		category: wildcard.category,
		difficulty: wildcard.difficulty,
		theme: wildcard.theme,
		description: wildcard.description,
		isActive: wildcard.isActive,
		version: wildcard.version,
		author: wildcard.author,
		createdAt: wildcard.createdAt.toISOString(),
		updatedAt: wildcard.updatedAt.toISOString(),
	};
}

/**
 * Serializa WildcardWithStats para respuestas de API
 */
export function serializeWildcardWithStats(wildcard: WildcardWithStats): Record<string, unknown> {
	return {
		...serializeWildcard(wildcard),
		entityType: wildcard.entityType,
		statistics: wildcard.statistics
			? {
					adaptabilityScore: wildcard.statistics.adaptabilityScore,
					usageDiversity: wildcard.statistics.usageDiversity,
					completenessScore: wildcard.statistics.completenessScore,
					popularity: wildcard.statistics.popularity,
				}
			: null,
		_count: (() => {
			const nc = normalizeCounts(wildcard._count);
			return {
				tags: nc.tags,
				images: nc.images,
				characters: nc.characters,
				places: nc.places,
				notes: nc.notes,
				childWildcards: wildcard._count?.childWildcards ?? 0,
			};
		})(),
	};
}

/**
 * Serializa un array de wildcards
 */
export function serializeWildcards(wildcards: WildcardBase[]): Record<string, unknown>[] {
	return wildcards.map(serializeWildcard);
}

/**
 * Serializa un array de wildcards con estadísticas
 */
export function serializeWildcardsWithStats(wildcards: WildcardWithStats[]): Record<string, unknown>[] {
	return wildcards.map(serializeWildcardWithStats);
}
