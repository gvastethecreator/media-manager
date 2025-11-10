/**
 * @file Funciones de modificación (CRUD) para grupos
 * @module services/group/mutations
 */

import * as crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groups } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { recomputeAggregatesForGroup } from '@/server/services/aggregates.service';
import type { GroupCreateInput, GroupUpdateInput, GroupWithStats } from '@/types/entities/group/types';
import { notifyGroupChange } from '../events/group-events';
import { GroupErrorCode, createGroupError } from '../types/group-service.types';
import { buildGroupWithStats, createEmptyGroupWithStats } from '../queries/group-stats-helper';

const logger = serverLogger.withContext('GroupService');

/**
 * Crea un nuevo grupo
 */
export const createGroupService = async (data: GroupCreateInput): Promise<GroupWithStats> => {
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
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Construir grupo con estadísticas vacías (recién creado)
		const groupWithStats = createEmptyGroupWithStats(newGroup[0]);

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
export const updateGroupService = async (id: string, data: GroupUpdateInput): Promise<GroupWithStats> => {
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

		// Actualizar grupo usando Drizzle
		const updatedGroup = await db.update(groups).set(updateData).where(eq(groups.id, id)).returning();

		// Obtener estadísticas actualizadas
		const groupWithStats = await buildGroupWithStats(updatedGroup[0]);

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
