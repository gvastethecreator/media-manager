'use server';

/**
 * @file Servicio para la entidad Folder
 * @module services/folder/folder.service
 * @description Lógica de negocio y acceso a datos para las carpetas.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import {
	fromPrismaFolder,
	fromPrismaFolders,
	mapCreateFolderDataToPrisma,
	mapUpdateFolderDataToPrisma,
} from '@/transformers/folder';
import type { FolderComplete, FolderCreateInput, FolderUpdateInput } from '@/types/entities/folder';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('FolderService');

/**
 * Objeto de inclusión de Prisma para asegurar que todas las relaciones
 * y conteos necesarios para el tipo `FolderComplete` se obtengan siempre.
 */
const FOLDER_INCLUDE = {
	images: { take: 10, orderBy: { createdAt: 'desc' } }, // Limitar para previsualización
	parent: true,
	children: true,
	_count: {
		select: {
			images: true,
			children: true,
		},
	},
};

/**
 * Revalida las rutas de caché relacionadas con las carpetas.
 * @param folderId - El ID de la carpeta específica para revalidar su página.
 */
async function revalidateFolderPaths(folderId?: string) {
	revalidatePath('/folders');
	revalidatePath('/settings/folders');
	if (folderId) {
		revalidatePath(`/folders/${folderId}`);
	}
}

/**
 * Obtiene todas las carpetas, opcionalmente filtrando por un ID de padre.
 * @param parentId - ID de la carpeta padre para obtener sus hijos.
 * @returns Una promesa que se resuelve con un array de carpetas completas.
 */
export async function getFolders(parentId?: string): Promise<FolderComplete[]> {
	logger.info('📂 Obteniendo carpetas', { parentId });
	try {
		const folders = await prisma.folder.findMany({
			where: { parentId: parentId === undefined ? null : parentId },
			orderBy: { name: 'asc' },
			include: FOLDER_INCLUDE,
		});
		return fromPrismaFolders(folders as any); // 'as any' para bypasear discrepancias de tipo temporales
	} catch (error) {
		logger.error('❌ Error al obtener carpetas', { error });
		throw new Error('No se pudieron obtener las carpetas.');
	}
}

/**
 * Obtiene una única carpeta por su ID.
 * @param id - El ID de la carpeta.
 * @returns Una promesa que se resuelve con la carpeta completa o null si no se encuentra.
 */
export async function getFolder(id: string): Promise<FolderComplete | null> {
	logger.info(`🔍 Obteniendo carpeta por ID: ${id}`);
	try {
		const folder = await prisma.folder.findUnique({
			where: { id },
			include: FOLDER_INCLUDE,
		});
		return folder ? fromPrismaFolder(folder as any) : null;
	} catch (error) {
		logger.error(`❌ Error al obtener la carpeta ${id}`, { error });
		throw new Error('No se pudo obtener la carpeta.');
	}
}

/**
 * Crea una nueva carpeta.
 * @param data - Los datos para crear la nueva carpeta.
 * @returns Una promesa que se resuelve con la carpeta recién creada.
 */
export async function createFolder(data: FolderCreateInput): Promise<FolderComplete> {
	logger.info('➕ Creando nueva carpeta', { name: data.name });
	try {
		const prismaData = mapCreateFolderDataToPrisma(data);
		const newFolder = await prisma.folder.create({
			data: prismaData,
			include: FOLDER_INCLUDE,
		});
		await revalidateFolderPaths();
		return fromPrismaFolder(newFolder as any);
	} catch (error) {
		logger.error('❌ Error al crear la carpeta', { error, data });
		throw new Error('No se pudo crear la carpeta.');
	}
}

/**
 * Actualiza una carpeta existente.
 * @param id - El ID de la carpeta a actualizar.
 * @param data - Los datos para actualizar la carpeta.
 * @returns Una promesa que se resuelve con la carpeta actualizada.
 */
export async function updateFolder(id: string, data: FolderUpdateInput): Promise<FolderComplete> {
	logger.info(`🔄 Actualizando carpeta: ${id}`);
	try {
		const prismaData = mapUpdateFolderDataToPrisma(data);
		const updatedFolder = await prisma.folder.update({
			where: { id },
			data: prismaData,
			include: FOLDER_INCLUDE,
		});
		await revalidateFolderPaths(id);
		return fromPrismaFolder(updatedFolder as any);
	} catch (error) {
		logger.error(`❌ Error al actualizar la carpeta ${id}`, { error, data });
		throw new Error('No se pudo actualizar la carpeta.');
	}
}

/**
 * Elimina una carpeta.
 * @param id - El ID de la carpeta a eliminar.
 */
export async function deleteFolder(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando carpeta: ${id}`);
	try {
		// Asegurarse de que no tenga hijos para evitar registros huérfanos
		const folder = await prisma.folder.findUnique({
			where: { id },
			select: { _count: { select: { children: true } } },
		});

		if (folder?._count.children > 0) {
			throw new Error('No se puede eliminar una carpeta que contiene otras carpetas.');
		}

		await prisma.folder.delete({ where: { id } });
		await revalidateFolderPaths();
	} catch (error) {
		logger.error(`❌ Error al eliminar la carpeta ${id}`, { error });
		const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar la carpeta.';
		throw new Error(errorMessage);
	}
}

// Nota: La lógica de indexación y eventos complejos se ha movido a un sistema de colas (Queue/Jobs)
// para desacoplar la lógica de negocio del acceso a datos y mejorar la escalabilidad.
// Este servicio se centra únicamente en operaciones CRUD.
