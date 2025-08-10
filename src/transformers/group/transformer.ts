/**
 * @file Transformador principal para la entidad Group
 * @module transformers/group/transformer
 * @description Funciones de transformación entre Drizzle y tipos de aplicación
 
 */

import { TransformerError } from '@/lib/errors/transformer-error';
import { serverLogger } from '@/lib/logger/server-logger';
import { createDefaultEntityStats } from '@/lib/utils';
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

		const imageCount = _count?.images || 0;
		const videoCount = _count?.videos || 0;
		const albumCount = _count?.albums || 0;
		const collectionCount = _count?.collections || 0;
		const tagCount = _count?.tags || 0;
		const characterCount = _count?.characters || 0;
		const placeCount = _count?.places || 0;
		const worldItemCount = _count?.worldItems || 0;
		const conceptCount = _count?.concepts || 0;
		const promptCount = _count?.prompts || 0;
		const noteCount = _count?.notes || 0;
		const wildcardCount = _count?.wildcards || 0;
		const propertyCount = _count?.properties || 0;

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
