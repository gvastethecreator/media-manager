/**
 * @file Funciones CRUD para gestión de grupos
 * @module services/group/group-crud
 */

import * as crypto from 'crypto';
import { and, count, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { recomputeAggregatesForGroup } from '@/server/services/aggregates.service';
import type { CreateGroupInput, GroupWithStats, UpdateGroupInput } from '@/types/entities/group/types';
import { createGroupError, GroupErrorCode } from './group-errors';
import { notifyGroupChange } from './group-events';

const logger = serverLogger.withContext('GroupCRUDService');

/**
 * Obtiene un grupo por su ID con estadísticas
 */
export const getGroupService = async (id: string): Promise<GroupWithStats | null> => {
	try {
		logger.info(`🔍 Buscando grupo con ID: ${id}`);

		// Buscar grupo base
		const groupResult = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (groupResult.length === 0) {
			logger.warn(`⚠️ Grupo no encontrado: ${id}`);
			return null;
		}

		const group = groupResult[0];

		// Construir grupo con estadísticas
		const groupWithStats: GroupWithStats = {
			...group,
		};

		logger.info(`✅ Grupo encontrado: ${group.name}`);
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener grupo por ID', { error, groupId: id });
		throw createGroupError(
			`Error al obtener grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene múltiples grupos por sus IDs
 */
export const getGroupsByIdsService = async (ids: string[]): Promise<GroupWithStats[]> => {
	try {
		logger.info(`🔍 Buscando grupos por IDs, cantidad: ${ids.length}`);

		if (ids.length === 0) {
			return [];
		}

		// Buscar grupos base
		const groupsResult = await db.select().from(groups).where(inArray(groups.id, ids));

		// ✅ OPTIMIZADO: Query única para obtener todos los counts de una vez
		const groupIds = groupsResult.map((g: { id: string }) => g.id);

		const [imageCounts, videoCounts, albumCounts, tagCounts] = await Promise.all([
			db
				.select({ groupId: groupImages.A, count: count() })
				.from(groupImages)
				.where(inArray(groupImages.A, groupIds))
				.groupBy(groupImages.A),
			db
				.select({ groupId: groupVideos.A, count: count() })
				.from(groupVideos)
				.where(inArray(groupVideos.A, groupIds))
				.groupBy(groupVideos.A),
			db
				.select({ groupId: groupAlbums.A, count: count() })
				.from(groupAlbums)
				.where(inArray(groupAlbums.A, groupIds))
				.groupBy(groupAlbums.A),
			db
				.select({ groupId: groupTags.A, count: count() })
				.from(groupTags)
				.where(inArray(groupTags.A, groupIds))
				.groupBy(groupTags.A),
		]);

		// Convertir arrays a Maps para lookup O(1)
		const imageCountMap = new Map(
			imageCounts.map((r: { groupId: string; count: number }) => [r.groupId, Number(r.count)])
		);
		const videoCountMap = new Map(
			videoCounts.map((r: { groupId: string; count: number }) => [r.groupId, Number(r.count)])
		);
		const albumCountMap = new Map(
			albumCounts.map((r: { groupId: string; count: number }) => [r.groupId, Number(r.count)])
		);
		const tagCountMap = new Map(tagCounts.map((r: { groupId: string; count: number }) => [r.groupId, Number(r.count)]));

		// Construir grupos con stats
		const groupsWithStats = groupsResult.map((group: typeof groups.$inferSelect) => {
			return {
				...group,
				_count: {
					images: imageCountMap.get(group.id) || 0,
					videos: videoCountMap.get(group.id) || 0,
					albums: albumCountMap.get(group.id) || 0,
					tags: tagCountMap.get(group.id) || 0,
					collections: 0,
					characters: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					notes: 0,
					wildcards: 0,
					properties: 0,
					groups: 0,
				},
			} as GroupWithStats;
		});

		logger.info(`✅ Grupos encontrados: ${groupsWithStats.length}`);
		return groupsWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener grupos por IDs', { error, ids });
		throw createGroupError(
			`Error al obtener grupos: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Crea un nuevo grupo
 */
export const createGroupService = async (data: CreateGroupInput): Promise<GroupWithStats> => {
	try {
		logger.info('✨ Creando nuevo grupo', { name: data.name });

		// Verificar si ya existe un grupo con el mismo nombre
		if (data.name) {
			const existingGroup = await db.select().from(groups).where(eq(groups.name, data.name)).limit(1);
			if (existingGroup.length > 0) {
				throw createGroupError(`Ya existe un grupo con el nombre "${data.name}"`, GroupErrorCode.ALREADY_EXISTS);
			}
		}

		// Crear grupo usando Drizzle
		const newGroup = await db
			.insert(groups)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description,
				isFavorite: data.isFavorite,
				category: data.category,
				filters: data.filters || '[]',
				// isActive: data.isActive !== false, // true por defecto - campo no existe en el esquema
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Construir grupo con estadísticas
		const groupWithStats: GroupWithStats = {
			...newGroup[0],
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				collections: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Notificar creación
		await notifyGroupChange('create', groupWithStats);

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForGroup(groupWithStats.id).catch((err) =>
			logger.warn('No se pudo recomputar agregados para grupo tras crear', { err, groupId: groupWithStats.id })
		);
		logger.info(`✅ Grupo creado: ${groupWithStats.name}`, { groupId: groupWithStats.id });
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al crear grupo', { error, data });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al crear grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Actualiza un grupo existente
 */
export const updateGroupService = async (id: string, data: UpdateGroupInput): Promise<GroupWithStats> => {
	try {
		logger.info(`📝 Actualizando grupo: ${id}`);

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		// Verificar nombre único si se está actualizando
		if (data.name && data.name !== existingGroup[0].name) {
			const groupWithSameName = await db
				.select()
				.from(groups)
				.where(and(eq(groups.name, data.name), eq(groups.id, id)))
				.limit(1);

			if (groupWithSameName.length > 0) {
				throw createGroupError(`Ya existe un grupo con el nombre "${data.name}"`, GroupErrorCode.ALREADY_EXISTS);
			}
		}

		// Preparar datos de actualización
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) {
			updateData.name = data.name;
		}
		if (data.description !== undefined) {
			updateData.description = data.description;
		}
		if (data.isFavorite !== undefined) {
			updateData.isFavorite = data.isFavorite;
		}
		if (data.category !== undefined) {
			updateData.category = data.category;
		}
		if (data.filters !== undefined) {
			updateData.filters = data.filters;
		}
		// if (data.isActive !== undefined) updateData.isActive = data.isActive; // campo no existe en el esquema

		// Actualizar grupo usando Drizzle
		const updatedGroup = await db.update(groups).set(updateData).where(eq(groups.id, id)).returning();

		// ✅ OPTIMIZADO: Obtener estadísticas actualizadas usando columna A
		const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
			db
				.select({ count: count() })
				.from(groupImages)
				.where(eq(groupImages.A, id))
				.then((res: any) => res[0]?.count || 0),
			db
				.select({ count: count() })
				.from(groupVideos)
				.where(eq(groupVideos.A, id))
				.then((res: any) => res[0]?.count || 0),
			db
				.select({ count: count() })
				.from(groupAlbums)
				.where(eq(groupAlbums.A, id))
				.then((res: any) => res[0]?.count || 0),
			db
				.select({ count: count() })
				.from(groupTags)
				.where(eq(groupTags.A, id))
				.then((res: any) => res[0]?.count || 0),
		]);

		const groupWithStats: GroupWithStats = {
			...updatedGroup[0],
			_count: {
				images: imageCount,
				videos: videoCount,
				albums: albumCount,
				tags: tagCount,
				collections: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Notificar actualización
		await notifyGroupChange('update', groupWithStats);

		// Recompute agregados (no bloqueante)
		recomputeAggregatesForGroup(groupWithStats.id).catch((err) =>
			logger.warn('No se pudo recomputar agregados para grupo tras actualizar', { err, groupId: groupWithStats.id })
		);

		logger.info(`✅ Grupo actualizado: ${groupWithStats.name}`, { groupId: groupWithStats.id });
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al actualizar grupo', { error, groupId: id, data });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al actualizar grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Elimina un grupo
 */
export const deleteGroupService = async (id: string): Promise<void> => {
	try {
		logger.info(`🗑️ Eliminando grupo: ${id}`);

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		// Notificar antes de eliminar
		await notifyGroupChange('delete', { id });

		// Eliminar usando Drizzle
		await db.delete(groups).where(eq(groups.id, id));

		logger.info(`✅ Grupo eliminado: ${id}`);
	} catch (error) {
		logger.error('❌ Error al eliminar grupo', { error, groupId: id });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al eliminar grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene estadísticas de un grupo
 */
export const getGroupStatsService = async (id: string): Promise<GroupWithStats | null> => {
	try {
		logger.info(`📊 Obteniendo estadísticas del grupo: ${id}`);

		// Reutilizar la lógica de getGroupService que ya está migrada
		const group = await getGroupService(id);

		if (!group) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		logger.info(`✅ Estadísticas obtenidas para grupo: ${id}`);
		return group;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas del grupo', { error, groupId: id });
		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}
		throw createGroupError(
			`Error al obtener estadísticas: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};
