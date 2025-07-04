/**
 * @file Transformador principal para la entidad Group
 * @module transformers/group/transformer
 * @description Funciones de transformación entre Drizzle y tipos de aplicación
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
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

		const stats: GroupStatistics = {
			imageCount: _count?.images || 0,
			videoCount: _count?.videos || 0,
			albumCount: _count?.albums || 0,
			collectionCount: _count?.collections || 0,
			tagCount: _count?.tags || 0,
			characterCount: _count?.characters || 0,
			placeCount: _count?.places || 0,
			worldItemCount: _count?.worldItems || 0,
			conceptCount: _count?.concepts || 0,
			promptCount: _count?.prompts || 0,
			noteCount: _count?.notes || 0,
			wildcardCount: _count?.wildcards || 0,
			propertyCount: _count?.properties || 0,
		};

		return {
			...baseData,
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