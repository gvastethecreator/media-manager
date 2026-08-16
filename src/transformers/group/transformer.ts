/**
 * @file Transformador principal para la entidad Group
 * @module transformers/group/transformer
 * @description Funciones de transformación entre Drizzle y tipos de aplicación
 
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
import { normalizeCounts, sumCounts, STANDARD_COUNT_KEYS } from '../common/counts';
import type { GroupBase, GroupStatistics, GroupWithStats } from '@/types/entities/group';

const logger = serverLogger.withContext('GroupTransformer');

/**
 * Transforma un objeto Group de Drizzle a GroupWithStats
 */
export function fromDrizzleGroup(drizzleGroup: any): GroupWithStats {
	if (!drizzleGroup) {
		throw new TransformerError('El objeto de grupo de Drizzle no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = drizzleGroup;

		const counts = normalizeCounts(_count);
		const imageCount = counts.images;
		const videoCount = counts.videos;
		const albumCount = counts.albums;
		const collectionCount = counts.collections;
		const tagCount = counts.tags;
		const characterCount = counts.characters;
		const placeCount = counts.places;
		const worldItemCount = counts.worldItems;
		const conceptCount = counts.concepts;
		const promptCount = counts.prompts;
		const noteCount = counts.notes;
		const wildcardCount = counts.wildcards;
		const propertyCount = counts.properties;

		const totalItems = sumCounts(_count, STANDARD_COUNT_KEYS);

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
			groupCount: 0,
			totalItems,
			totalAssociations: totalItems,
			completeness: totalItems > 0 ? Math.min(100, Math.round((totalItems / 10) * 100)) : 0,
			lastUpdated: baseData.updatedAt || new Date(),
		};

		return {
			...baseData,
			entityType: 'group' as const,
			statistics: stats,
			stats,
		};
	} catch (error) {
		logger.error('Error transformando grupo desde Drizzle', {
			error,
			groupId: drizzleGroup?.id,
		});
		throw new TransformerError(`Error al transformar el grupo: ${(error as Error).message}`);
	}
}

/**
 * Transforma una lista de grupos de Drizzle a GroupWithStats[]
 */
export function fromDrizzleGroups(drizzleGroups: any[]): GroupWithStats[] {
	return drizzleGroups.map(fromDrizzleGroup);
}

/**
 * Convierte un GroupBase a DrizzleGroup para inserción/actualización
 */
export function toDrizzleGroup(group: GroupBase): any {
	return {
		id: group.id,
		name: group.name,
		description: group.description,
		emoji: group.emoji,
		color: group.color,
		isFavorite: group.isFavorite,
		createdAt: group.createdAt,
		updatedAt: group.updatedAt,
	};
}
