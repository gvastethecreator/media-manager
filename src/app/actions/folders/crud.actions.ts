'use server';

/**
 * @file Acciones CRUD para carpetas
 * @module app/actions/folders/crud.actions
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
import { CreateFolderSchema, UpdateFolderSchema } from '@/types/entities/folder/schema';
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('FolderActions');

// Objeto de inclusión para obtener una carpeta completa con todas sus relaciones.
const FOLDER_INCLUDE = {
	images: true,
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
 * Crea una nueva carpeta en la base de datos.
 */
export async function createFolder(input: FolderCreateInput): Promise<FolderComplete> {
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
	} catch (error) {
		throw new Error(`La carpeta no existe o no es accesible en la ruta: '${validatedInput.path}'.`);
	}

	// 3. Mapear y crear en la base de datos
	const prismaData = mapCreateFolderDataToPrisma(validatedInput);
	const folder = await prisma.folder.create({
		data: prismaData,
		include: FOLDER_INCLUDE,
	});

	revalidatePath('/folders');
	logger.info('✅ Folder created successfully:', folder);
	return fromPrismaFolder(folder);
}

/**
 * Actualiza una carpeta existente.
 */
export async function updateFolder(id: string, input: FolderUpdateInput): Promise<FolderComplete> {
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
		include: FOLDER_INCLUDE,
	});

	revalidatePath('/folders');
	revalidatePath(`/folders/${id}`);
	logger.info(`✅ Folder ${id} updated successfully.`);
	return fromPrismaFolder(updatedFolder);
}

/**
 * Elimina una carpeta.
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
 * Obtiene una carpeta por su ID.
 */
export async function getFolder(id: string): Promise<FolderComplete | null> {
	logger.info(`🔍 Getting folder ${id}`);
	const folder = await prisma.folder.findUnique({
		where: { id },
		include: FOLDER_INCLUDE,
	});
	return folder ? fromPrismaFolder(folder) : null;
}

/**
 * Obtiene todas las carpetas.
 */
export async function getAllFolders(): Promise<FolderComplete[]> {
	logger.info('📂 Getting all folders');
	const folders = await prisma.folder.findMany({
		orderBy: { name: 'asc' },
		include: FOLDER_INCLUDE,
	});
	return fromPrismaFolders(folders);
}
