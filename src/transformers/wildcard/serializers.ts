/**
 * 🃏 WILDCARD SERIALIZERS
 *
 * Funciones de serialización para respuestas de API.
 *
 * @updated 2025-01-27
 */

import { WildcardBase, WildcardWithStats } from '../../types/entities/wildcard';

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
		_count: wildcard._count
			? {
					tags: wildcard._count.tags || 0,
					images: wildcard._count.images || 0,
					characters: wildcard._count.characters || 0,
					places: wildcard._count.places || 0,
					notes: wildcard._count.notes || 0,
					childWildcards: wildcard._count.childWildcards || 0,
				}
			: {
					tags: 0,
					images: 0,
					characters: 0,
					places: 0,
					notes: 0,
					childWildcards: 0,
				},
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
