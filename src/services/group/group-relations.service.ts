/**
 * @file Gestión de relaciones de grupos
 * @module services/group/group-relations
 * @description Manejo de relaciones N:N entre grupos y otros tipos de entidades
 */
// @ts-nocheck - Temporary suppression for implicit any parameter types

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { recomputeAggregatesForGroup } from '@/server/services/aggregates.service';
import type { GroupRelations } from '@/types/entities/group/types';
import { createGroupError, GroupErrorCode } from './group-errors';
import { notifyGroupChange } from './group-events';

const logger = serverLogger.withContext('GroupService');

/**
 * Añade un elemento (imagen, video, álbum o tag) a un grupo
 *
 * @param groupId - ID del grupo
 * @param itemId - ID del elemento a añadir
 * @param itemType - Tipo de elemento (images, videos, albums, tags)
 * @throws {GroupServiceError} Si el grupo no existe o el tipo es inválido
 */
export const addItemToGroupService = async (
	groupId: string,
	itemId: string,
	itemType: keyof GroupRelations
): Promise<void> => {
	try {
		logger.info('➕ Añadiendo elemento a grupo', { groupId, itemId, itemType });

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${groupId}`, GroupErrorCode.NOT_FOUND);
		}

		// Validar y crear la relación según el tipo usando Drizzle
		switch (itemType) {
			case 'images':
				await db.insert(groupImages).values({ groupId, imageId: itemId });
				break;
			case 'videos':
				await db.insert(groupVideos).values({ groupId, videoId: itemId });
				break;
			case 'albums':
				await db.insert(groupAlbums).values({ groupId, albumId: itemId });
				break;
			case 'tags':
				await db.insert(groupTags).values({ groupId, tagId: itemId });
				break;
			default:
				throw createGroupError(`Tipo de elemento no soportado: ${itemType}`, GroupErrorCode.INVALID_DATA);
		}

		// Notificar cambio
		await notifyGroupChange('items:add', { id: groupId });

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForGroup(groupId).catch((err) =>
			logger.warn('No se pudo recomputar agregados para grupo tras añadir item', { err, groupId })
		);

		logger.info('✅ Elemento añadido al grupo', { groupId, itemId, itemType });
	} catch (error) {
		logger.error('❌ Error al añadir elemento al grupo', { error, groupId, itemId, itemType });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al añadir elemento: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Elimina un elemento (imagen, video, álbum o tag) de un grupo
 *
 * @param groupId - ID del grupo
 * @param itemId - ID del elemento a eliminar
 * @param itemType - Tipo de elemento (images, videos, albums, tags)
 * @throws {GroupServiceError} Si el grupo no existe o el tipo es inválido
 */
export const removeItemFromGroupService = async (
	groupId: string,
	itemId: string,
	itemType: keyof GroupRelations
): Promise<void> => {
	try {
		logger.info('➖ Eliminando elemento del grupo', { groupId, itemId, itemType });

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${groupId}`, GroupErrorCode.NOT_FOUND);
		}

		// Validar y eliminar la relación según el tipo usando Drizzle
		switch (itemType) {
			case 'images':
				await db.delete(groupImages).where(and(eq(groupImages.groupId, groupId), eq(groupImages.imageId, itemId)));
				break;
			case 'videos':
				await db.delete(groupVideos).where(and(eq(groupVideos.groupId, groupId), eq(groupVideos.videoId, itemId)));
				break;
			case 'albums':
				await db.delete(groupAlbums).where(and(eq(groupAlbums.groupId, groupId), eq(groupAlbums.albumId, itemId)));
				break;
			case 'tags':
				await db.delete(groupTags).where(and(eq(groupTags.groupId, groupId), eq(groupTags.tagId, itemId)));
				break;
			default:
				throw createGroupError(`Tipo de elemento no soportado: ${itemType}`, GroupErrorCode.INVALID_DATA);
		}

		// Notificar cambio
		await notifyGroupChange('items:remove', { id: groupId });

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForGroup(groupId).catch((err) =>
			logger.warn('No se pudo recomputar agregados para grupo tras quitar item', { err, groupId })
		);

		logger.info('✅ Elemento eliminado del grupo', { groupId, itemId, itemType });
	} catch (error) {
		logger.error('❌ Error al eliminar elemento del grupo', { error, groupId, itemId, itemType });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al eliminar elemento: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};
