/**
 * 🃏 WILDCARD SERIALIZERS
 *
 * Funciones de serialización para respuestas de API.
 *
 * @updated 2025-01-27
 */

import {
    WildcardBase,
    WildcardWithStats,
} from '@/types/entities/wildcard';

/**
 * Serializa WildcardBase para respuestas de API
 */
export function serializeWildcard(wildcard: WildcardBase): Record<string, any> {
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
export function serializeWildcardWithStats(wildcard: WildcardWithStats): Record<string, any> {
	return {
		...serializeWildcard(wildcard),
		stats: {
			usageCount: wildcard.stats.usageCount,
			complexityScore: wildcard.stats.complexityScore,
			popularityScore: wildcard.stats.popularityScore,
			lastUsed: wildcard.stats.lastUsed?.toISOString() || null,
			completenessScore: wildcard.stats.completenessScore,
		},
	};
}

/**
 * Serializa un array de wildcards
 */
export function serializeWildcards(wildcards: WildcardBase[]): Record<string, any>[] {
	return wildcards.map(serializeWildcard);
}

/**
 * Serializa un array de wildcards con estadísticas
 */
export function serializeWildcardsWithStats(wildcards: WildcardWithStats[]): Record<string, any>[] {
	return wildcards.map(serializeWildcardWithStats);
}
