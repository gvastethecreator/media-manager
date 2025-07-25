/**
 * @file Mappers para la entidad Group.
 * @module transformers/group/mappers
 * @description Contiene funciones para transformar datos de la entidad Group.
 * @updated 2025-01-27 - MIGRADO A DRIZZLE ORM
 */

import { calculateCompleteness } from '@/lib/utils/transformers';
import type { GroupBase, GroupStatistics, GroupWithStats } from '@/types/entities/group';

/**
 * Convierte un GroupBase a GroupWithStats calculando estadísticas.
 * @param group - Datos base del grupo
 * @param counts - Conteos de relaciones (opcional)
 * @returns GroupWithStats
 */
export function toGroupWithStats(group: GroupBase, counts?: Record<string, number>): GroupWithStats {
	// Calcular estadísticas básicas
	const totalItems = counts ? Object.values(counts).reduce((sum: number, count: number) => sum + (count || 0), 0) : 0;

	// Calcular completitud basada en campos importantes
	const completenessScore = calculateCompleteness(group, ['name', 'description', 'category']);

	// Calcular popularidad basada en el total de items
	const popularity = Math.log1p(totalItems);

	const stats: GroupStatistics = {
		totalItems,
		completeness: completenessScore,
		popularity: Number.parseFloat(popularity.toFixed(2)),
		lastUpdated: new Date().toISOString(),
	};

	return {
		...group,
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
