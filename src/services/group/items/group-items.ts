/**
 * @file Funciones de manejo de items en grupos
 * @module services/group/items
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { recomputeAggregatesForGroup } from '@/server/services/aggregates.service';
import { notifyGroupChange } from '../events/group-events';
import { GroupErrorCode, createGroupError } from '../types/group-service.types';

const logger = serverLogger.withContext('GroupService');

/**
 * Añade un elemento a un grupo
 */
export const addItemToGroupService = async (
	groupId: string,
	itemId: string,
	itemType: 'images' | 'videos' | 'albums' | 'tags'
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
				await db.insert(groupImages).values({ A: groupId, B: itemId });
				break;
			case 'videos':
				await db.insert(groupVideos).values({ A: groupId, B: itemId });
				break;
			case 'albums':
				await db.insert(groupAlbums).values({ A: groupId, B: itemId });
				break;
			case 'tags':
				await db.insert(groupTags).values({ A: groupId, B: itemId });
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
 * Elimina un elemento de un grupo
 */
export const removeItemFromGroupService = async (
	groupId: string,
	itemId: string,
	itemType: 'images' | 'videos' | 'albums' | 'tags'
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
				await db.delete(groupImages).where(and(eq(groupImages.A, groupId), eq(groupImages.B, itemId)));
				break;
			case 'videos':
				await db.delete(groupVideos).where(and(eq(groupVideos.A, groupId), eq(groupVideos.B, itemId)));
				break;
			case 'albums':
				await db.delete(groupAlbums).where(and(eq(groupAlbums.A, groupId), eq(groupAlbums.B, itemId)));
				break;
			case 'tags':
				await db.delete(groupTags).where(and(eq(groupTags.A, groupId), eq(groupTags.B, itemId)));
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
