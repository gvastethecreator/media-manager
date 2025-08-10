/**
 * @file Mappers para la entidad Group.
 * @module transformers/group/mappers
 * @description Contiene funciones para transformar datos de la entidad Group.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import { createDefaultEntityStats } from '@/lib/utils';
import { calculateCompleteness } from '@/lib/utils/transformers/calculate-completeness';
import type { GroupBase, GroupStatistics, GroupWithStats } from '@/types/entities/group';

/**
 * Convierte un GroupBase a GroupWithStats calculando estadísticas.
 * @param group - Datos base del grupo
 * @param counts - Conteos de relaciones (opcional)
 * @returns GroupWithStats
 */
export function toGroupWithStats(group: GroupBase, counts?: Record<string, number>): GroupWithStats {
	// Calcular estadísticas básicas
	const imageCount = counts?.images ?? 0;
	const videoCount = counts?.videos ?? 0;
	const albumCount = counts?.albums ?? 0;
	const collectionCount = counts?.collections ?? 0;
	const tagCount = counts?.tags ?? 0;
	const characterCount = counts?.characters ?? 0;
	const placeCount = counts?.places ?? 0;
	const worldItemCount = counts?.worldItems ?? 0;
	const conceptCount = counts?.concepts ?? 0;
	const promptCount = counts?.prompts ?? 0;
	const noteCount = counts?.notes ?? 0;
	const wildcardCount = counts?.wildcards ?? 0;
	const propertyCount = counts?.properties ?? 0;

	const totalItems =
		imageCount +
		videoCount +
		albumCount +
		collectionCount +
		tagCount +
		characterCount +
		placeCount +
		worldItemCount +
		conceptCount +
		promptCount +
		noteCount +
		wildcardCount +
		propertyCount;

	// Calcular completitud basada en campos importantes
	const completenessScore = calculateCompleteness(group, ['name', 'description', 'category']);

	// Calcular popularidad basada en el total de items
	const popularity = Math.log1p(totalItems);

	const stats: GroupStatistics = {
		...createDefaultEntityStats(),
		imageCount,
		videoCount,
		albumCount,
		collectionCount,
		tagCount,
		characterCount,
		placeCount,
		worldItemCount,
		conceptCount,
		promptCount,
		noteCount,
		wildcardCount,
		propertyCount,
		groupCount: 0, // Los grupos no contienen otros grupos por defecto
		totalItems,
		totalAssociations: totalItems,
		// Propiedades específicas de GroupStatistics
		completeness: completenessScore,
		lastUpdated: new Date(),
	};

	return {
		...group,
		entityType: 'group' as const,
		statistics: stats,
		stats,
	};
}

/**
 * Convierte una lista de GroupBase a GroupWithStats.
 * @param groups - Lista de grupos base
 * @returns Lista de GroupWithStats
 */
export function toGroupWithStatsList(groups: GroupBase[]): GroupWithStats[] {
	return groups.map((group) => toGroupWithStats(group));
}
