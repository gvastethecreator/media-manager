'use server';

/**
 * @file Server Actions para la entidad Group
 * @module app/actions/groups/group.actions
 * @description Acciones CRUD y de gestión para los grupos.
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { toGroupWithStats } from '@/transformers/group';
import type { GroupWithStats } from '@/types/entities/group';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('GroupActions');

const revalidatePaths = ['/groups', '/settings/groups']; // Ajustar a rutas reales

const groupWithStatsInclude = {
	_count: {
		select: {
			images: true,
			videos: true,
			albums: true,
			collections: true,
			tags: true,
			characters: true,
			places: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			properties: true,
		},
	},
};

/**
 * Obtiene todos los grupos con sus estadísticas.
 */
export async function getGroups(): Promise<GroupWithStats[]> {
	try {
		logger.info('👥 Obteniendo todos los grupos');
		const groups = await prisma.group.findMany({
			include: groupWithStatsInclude,
			orderBy: { name: 'asc' },
		});
		return groups.map(group => toGroupWithStats(group, group._count));
	} catch (error) {
		logger.error('❌ Error al obtener los grupos.', { error });
		throw new Error('No se pudieron obtener los grupos.');
	}
}

/**
 * Obtiene un único grupo por su ID con estadísticas.
 */
export async function getGroup(id: string): Promise<GroupWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo grupo por ID: ${id}`);
		const group = await prisma.group.findUnique({
			where: { id },
			include: groupWithStatsInclude,
		});

		if (!group) {
			logger.warn(`Grupo no encontrado: ${id}`);
			return null;
		}
		return toGroupWithStats(group, group._count);
	} catch (error) {
		logger.error(`❌ Error al obtener el grupo ${id}.`, { error });
		throw new Error(`No se pudo obtener el grupo.`);
	}
}

/**
 * Crea un nuevo grupo.
 */
export async function createGroup(data: Prisma.GroupCreateInput): Promise<GroupWithStats> {
	try {
		logger.info('📝 Creando nuevo grupo:', { name: data.name });
		const newGroup = await prisma.group.create({
			data,
			include: groupWithStatsInclude,
		});
		revalidatePaths.forEach(path => revalidatePath(path));
		return toGroupWithStats(newGroup, newGroup._count);
	} catch (error) {
		logger.error('❌ Error al crear el grupo.', { error, data });
		throw new Error('No se pudo crear el grupo.');
	}
}

/**
 * Actualiza un grupo existente.
 */
export async function updateGroup(id: string, data: Prisma.GroupUpdateInput): Promise<GroupWithStats> {
	try {
		logger.info(`🔄 Actualizando grupo: ${id}`);
		const updatedGroup = await prisma.group.update({
			where: { id },
			data,
			include: groupWithStatsInclude,
		});
		revalidatePaths.forEach(path => revalidatePath(path));
		revalidatePath(`/groups/${id}`);
		return toGroupWithStats(updatedGroup, updatedGroup._count);
	} catch (error) {
		logger.error(`❌ Error al actualizar el grupo ${id}.`, { error, data });
		throw new Error('No se pudo actualizar el grupo.');
	}
}

/**
 * Elimina un grupo.
 */
export async function deleteGroup(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando grupo: ${id}`);
		await prisma.group.delete({ where: { id } });
		revalidatePaths.forEach(path => revalidatePath(path));
	} catch (error) {
		logger.error(`❌ Error al eliminar el grupo ${id}.`, { error });
		throw new Error('No se pudo eliminar el grupo.');
	}
}

/**
 * Actualiza el estado de favorito de un grupo.
 */
export async function toggleGroupFavorite(id: string): Promise<GroupWithStats> {
	try {
		const current = await prisma.group.findUnique({ where: { id }, select: { isFavorite: true } });
		if (!current) {
			logger.error(`⭐ Error al cambiar favorito: Grupo no encontrado: ${id}`);
			throw new Error('Grupo no encontrado para cambiar estado de favorito.');
		}

		const updatedGroup = await prisma.group.update({
			where: { id },
			data: { isFavorite: !current.isFavorite },
			include: groupWithStatsInclude,
		});

		revalidatePaths.forEach(path => revalidatePath(path));
		revalidatePath(`/groups/${id}`);
		logger.info(`⭐ Favorito cambiado para grupo: ${id}`);
		return toGroupWithStats(updatedGroup, updatedGroup._count);
	} catch (error) {
		logger.error(`❌ Error al cambiar favorito para el grupo ${id}.`, { error });
		throw new Error('No se pudo actualizar el estado de favorito.');
	}
}
