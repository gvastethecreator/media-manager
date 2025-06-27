'use server';

/**
 * @file Acciones CRUD para carpetas - Patrón EntityWithStats
 * @module app/actions/folders/crud.actions
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/database/prisma';
import {
	fromPrismaFolderWithCounts,
	fromPrismaFoldersWithCounts,
	folderWithCountsPayload,
	mapCreateFolderDataToPrisma,
	mapUpdateFolderDataToPrisma,
} from '@/transformers/folder';
import type { FolderWithStats, FolderCreateInput, FolderUpdateInput } from '@/types/entities/folder';
import { CreateFolderSchema, UpdateFolderSchema } from '@/types/entities/folder/schema';
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('FolderActions');

/**
 * 📁 Crea una nueva carpeta en la base de datos
 */
export async function createFolder(input: FolderCreateInput): Promise<FolderWithStats> {
	logger.info('📁 Creating new folder:', input);
	const validatedInput = CreateFolderSchema.parse(input);

	// 1. Validar que la ruta no esté duplicada
	const existing = await prisma.folder.findFirst({
		where: { path: validatedInput.path },
	});
	if (existing) {
		throw new Error(`La ruta de la carpeta '${validatedInput.path}' ya está en uso.`);
	}

	// 2. Validar que la carpeta exista en el sistema de archivos
	try {
		const stats = await fs.stat(validatedInput.path);
		if (!stats.isDirectory()) {
			throw new Error(`La ruta '${validatedInput.path}' no es un directorio válido.`);
		}
	} catch (_error) {
		throw new Error(`La carpeta no existe o no es accesible en la ruta: '${validatedInput.path}'.`);
	}

	// 3. Mapear y crear en la base de datos
	const prismaData = mapCreateFolderDataToPrisma(validatedInput);
	const folder = await prisma.folder.create({
		data: prismaData,
		...folderWithCountsPayload,
	});

	revalidatePath('/folders');
	logger.info('✅ Folder created successfully:', folder);

	const result = fromPrismaFolderWithCounts(folder);
	if (!result) {
		throw new Error('Error al transformar la carpeta creada');
	}

	return result;
}

/**
 * 📁 Actualiza una carpeta existente
 */
export async function updateFolder(id: string, input: FolderUpdateInput): Promise<FolderWithStats> {
	logger.info(`📝 Updating folder ${id}:`, input);
	const validatedInput = UpdateFolderSchema.parse(input);

	if (validatedInput.path) {
		const existing = await prisma.folder.findFirst({
			where: { path: validatedInput.path, id: { not: id } },
		});
		if (existing) {
			throw new Error(`La ruta de la carpeta '${validatedInput.path}' ya está en uso por otra carpeta.`);
		}
	}

	const prismaData = mapUpdateFolderDataToPrisma(validatedInput);
	const updatedFolder = await prisma.folder.update({
		where: { id },
		data: prismaData,
		...folderWithCountsPayload,
	});

	revalidatePath('/folders');
	revalidatePath(`/folders/${id}`);
	logger.info(`✅ Folder ${id} updated successfully.`);

	const result = fromPrismaFolderWithCounts(updatedFolder);
	if (!result) {
		throw new Error('Error al transformar la carpeta actualizada');
	}

	return result;
}

/**
 * 📁 Elimina una carpeta
 */
export async function deleteFolder(id: string): Promise<void> {
	logger.warn(`🗑️ Deleting folder ${id}`);

	// 1. Verificar que no tenga subcarpetas
	const childrenCount = await prisma.folder.count({ where: { parentId: id } });
	if (childrenCount > 0) {
		throw new Error('No se puede eliminar una carpeta que contiene otras carpetas.');
	}

	// 2. Eliminar la carpeta (esto también eliminará en cascada las imágenes si está configurado en el schema.prisma)
	await prisma.folder.delete({ where: { id } });

	revalidatePath('/folders');
	logger.info(`✅ Folder ${id} deleted successfully.`);
}

/**
 * 📁 Obtiene una carpeta por su ID con estadísticas
 */
export async function getFolder(id: string): Promise<FolderWithStats | null> {
	logger.info(`🔍 Getting folder ${id}`);

	const folder = await prisma.folder.findUnique({
		where: { id },
		...folderWithCountsPayload,
	});

	return folder ? fromPrismaFolderWithCounts(folder) : null;
}

/**
 * 📁 Obtiene todas las carpetas con estadísticas
 */
export async function getAllFolders(): Promise<FolderWithStats[]> {
	logger.info('📂 Getting all folders');

	const folders = await prisma.folder.findMany({
		orderBy: { name: 'asc' },
		...folderWithCountsPayload,
	});

	return fromPrismaFoldersWithCounts(folders);
}

/**
 * 📁 Busca carpetas con filtros avanzados
 */
export async function findFolders(options: {
	search?: string;
	parentId?: string | null;
	isFavorite?: boolean;
	skip?: number;
	take?: number;
	orderBy?: 'name' | 'date' | 'size' | 'organization';
	order?: 'asc' | 'desc';
}): Promise<{ folders: FolderWithStats[]; total: number }> {
	logger.info('🔍 Finding folders with options:', options);

	const { search, parentId, isFavorite, skip = 0, take = 50, orderBy = 'name', order = 'asc' } = options;

	// Construir where clause
	const where: any = {};

	if (search) {
		where.OR = [
			{ name: { contains: search, mode: 'insensitive' } },
			{ description: { contains: search, mode: 'insensitive' } },
			{ path: { contains: search, mode: 'insensitive' } },
		];
	}

	if (parentId !== undefined) {
		where.parentId = parentId;
	}

	if (isFavorite !== undefined) {
		where.isFavorite = isFavorite;
	}

	// Construir orderBy clause
	let prismaOrderBy: any;
	switch (orderBy) {
		case 'name':
			prismaOrderBy = { name: order };
			break;
		case 'date':
			prismaOrderBy = { createdAt: order };
			break;
		case 'size':
			prismaOrderBy = { totalSize: order };
			break;
		default:
			prismaOrderBy = { name: order };
	}

	const [folders, total] = await prisma.$transaction([
		prisma.folder.findMany({
			where,
			orderBy: prismaOrderBy,
			skip,
			take,
			...folderWithCountsPayload,
		}),
		prisma.folder.count({ where }),
	]);

	logger.info(`✅ Found ${folders.length} of ${total} folders.`);

	return {
		folders: fromPrismaFoldersWithCounts(folders),
		total,
	};
}

/**
 * 📁 Mueve una carpeta a un nuevo padre
 */
export async function moveFolder(folderId: string, newParentId: string | null): Promise<FolderWithStats> {
	logger.info(`📁 Moving folder ${folderId} to parent ${newParentId}`);

	// Validar que no se cree un ciclo
	if (newParentId) {
		const targetFolder = await prisma.folder.findUnique({
			where: { id: folderId },
			select: { id: true, path: true },
		});

		const newParent = await prisma.folder.findUnique({
			where: { id: newParentId },
			select: { id: true, path: true },
		});

		if (!targetFolder || !newParent) {
			throw new Error('Carpeta origen o destino no encontrada');
		}

		// Verificar que no se mueva a una subcarpeta de sí misma
		if (newParent.path.startsWith(targetFolder.path)) {
			throw new Error('No se puede mover una carpeta a una subcarpeta de sí misma');
		}
	}

	const updatedFolder = await prisma.folder.update({
		where: { id: folderId },
		data: { parentId: newParentId },
		...folderWithCountsPayload,
	});

	revalidatePath('/folders');
	logger.info(`✅ Folder ${folderId} moved successfully.`);

	const result = fromPrismaFolderWithCounts(updatedFolder);
	if (!result) {
		throw new Error('Error al transformar la carpeta movida');
	}

	return result;
}

/**
 * 📁 Alterna el estado de favorito de una carpeta
 */
export async function toggleFolderFavorite(id: string): Promise<FolderWithStats> {
	logger.info(`⭐ Toggling favorite status for folder ${id}`);

	const currentFolder = await prisma.folder.findUnique({
		where: { id },
		select: { isFavorite: true },
	});

	if (!currentFolder) {
		throw new Error('Carpeta no encontrada');
	}

	const updatedFolder = await prisma.folder.update({
		where: { id },
		data: { isFavorite: !currentFolder.isFavorite },
		...folderWithCountsPayload,
	});

	revalidatePath('/folders');
	revalidatePath(`/folders/${id}`);

	const result = fromPrismaFolderWithCounts(updatedFolder);
	if (!result) {
		throw new Error('Error al transformar la carpeta actualizada');
	}

	return result;
}
