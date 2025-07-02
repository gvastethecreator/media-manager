'use server';

/**
 * @file Acciones CRUD para carpetas - Patrón EntityWithStats
 * @module app/actions/folders/crud.actions
 */

import { prisma } from '@/lib/database/prisma';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	folderWithCountsPayload,
	fromPrismaFoldersWithCounts,
	fromPrismaFolderWithCounts,
	mapCreateFolderDataToPrisma,
	mapUpdateFolderDataToPrisma,
} from '@/transformers/folder';
import type { FolderCreateInput, FolderUpdateInput, FolderWithStats } from '@/types/entities/folder';
import { CreateFolderSchema, UpdateFolderSchema } from '@/types/entities/folder/schema';
import fs from 'fs/promises';
import { revalidatePath } from '@/lib/server/revalidate';

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
	const where: Record<string, unknown> = {};

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
	let prismaOrderBy: Record<string, string> | Record<string, string>[];
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

/**
 * 🔄 Reindexa una carpeta específica
 * Escanea el sistema de archivos y actualiza las imágenes en la base de datos
 */
export async function reindexFolder(folderId: string): Promise<FolderWithStats> {
	logger.info(`🔄 Starting reindex for folder ${folderId}`);

	// 1. Obtener información de la carpeta
	const folder = await prisma.folder.findUnique({
		where: { id: folderId },
		select: { path: true, name: true },
	});

	if (!folder) {
		throw new Error('Carpeta no encontrada');
	}

	// 2. Importar el scanner de carpetas (dynamic import para evitar issues)
	const { scanFolder } = await import('@/lib/filesystem/folder-scanner');
	const { createHash } = await import('crypto');

	try {
		// 3. Escanear la carpeta
		logger.info(`📂 Scanning folder: ${folder.path}`);
		const scanResult = await scanFolder(folder.path, {
			recursive: false, // Solo nivel actual por ahora
			includeHidden: false,
			includeExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif', '.svg'],
		});

		logger.info(`📊 Scan completed. Found ${scanResult.files.length} files`);

		// DEBUG: Mostrar algunos archivos encontrados
		if (scanResult.files.length > 0) {
			logger.info(
				'📋 First 3 files found:',
				scanResult.files.slice(0, 3).map((f) => ({ name: f.name, path: f.path, size: f.size }))
			);
		}

		// 4. Obtener imágenes existentes en la BD para esta carpeta
		const existingImages = await prisma.image.findMany({
			where: { folderId },
			select: { path: true, name: true, id: true },
		});

		logger.info(`📄 Existing images in DB: ${existingImages.length}`);
		const existingPaths = new Set(existingImages.map((img) => img.path));

		// 5. Procesar archivos encontrados
		const newImages = [];
		const updatedImages = [];

		for (const file of scanResult.files) {
			const fullPath = file.path;

			if (existingPaths.has(fullPath)) {
				// Archivo ya existe, actualizar solo el tamaño
				updatedImages.push({
					path: fullPath,
					name: file.name,
					size: file.size,
				});
			} else {
				// Archivo nuevo, agregar a la lista
				// Crear hash básico usando path + size como identificador único
				const hashInput = `${fullPath}:${file.size}:${file.modifiedAt.getTime()}`;
				const hash = createHash('md5').update(hashInput).digest('hex');

				newImages.push({
					name: file.name,
					path: fullPath,
					folderId,
					hash,
					size: file.size,
					width: 0, // Por defecto, se actualizará después
					height: 0, // Por defecto, se actualizará después
					metadata: '{}',
				});
			}
		}

		// DEBUG: Log final counts
		logger.info(`📊 Processing complete. New images: ${newImages.length}, Updated images: ${updatedImages.length}`);

		// 6. Insertar nuevas imágenes
		if (newImages.length > 0) {
			logger.info(`➕ Adding ${newImages.length} new images`);
			// DEBUG: Mostrar primera imagen a insertar
			logger.info('🔍 First new image:', newImages[0]);
			await prisma.image.createMany({
				data: newImages,
			});
			logger.info('✅ Images inserted successfully');
		}

		// 7. Actualizar imágenes existentes (solo las que han cambiado)
		for (const updated of updatedImages) {
			await prisma.image.updateMany({
				where: {
					path: updated.path,
					folderId,
				},
				data: {
					size: updated.size,
				},
			});
		}

		// 8. Identificar y marcar imágenes eliminadas (opcional)
		const scannedPaths = new Set(scanResult.files.map((f) => f.path));
		const deletedImages = existingImages.filter((img) => !scannedPaths.has(img.path));

		if (deletedImages.length > 0) {
			logger.info(`🗑️ Found ${deletedImages.length} deleted files, removing from database`);
			await prisma.image.deleteMany({
				where: {
					id: { in: deletedImages.map((img) => img.id) },
				},
			});
		}

		// 9. Actualizar folder con nueva fecha de indexación
		const updatedFolder = await prisma.folder.update({
			where: { id: folderId },
			data: {
				lastIndexed: new Date(),
			},
			...folderWithCountsPayload,
		});

		revalidatePath('/folders');
		revalidatePath(`/folders/${folderId}`);

		logger.info(
			`✅ Reindex completed for folder ${folderId}. Added: ${newImages.length}, Updated: ${updatedImages.length}, Deleted: ${deletedImages.length}`
		);

		const result = fromPrismaFolderWithCounts(updatedFolder);
		if (!result) {
			throw new Error('Error al transformar la carpeta reindexada');
		}

		return result;
	} catch (error) {
		logger.error(`❌ Error reindexing folder ${folderId}:`, error);

		// Marcar la carpeta con error en un campo que existe
		await prisma.folder.update({
			where: { id: folderId },
			data: {
				lastIndexed: new Date(), // Actualizar fecha aunque haya habido error
			},
		});

		throw error;
	}
}

/**
 * 🔄 Reindexa todas las carpetas
 */
export async function reindexAllFolders(): Promise<{ processed: number; errors: string[] }> {
	logger.info('🔄 Starting global reindex');

	const folders = await prisma.folder.findMany({
		select: { id: true, name: true },
	});

	const results = {
		processed: 0,
		errors: [] as string[],
	};

	for (const folder of folders) {
		try {
			await reindexFolder(folder.id);
			results.processed++;
			logger.info(`✅ Reindexed folder: ${folder.name}`);
		} catch (error) {
			const errorMessage = `Error en ${folder.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
			results.errors.push(errorMessage);
			logger.error(`❌ Failed to reindex folder ${folder.name}:`, error);
		}
	}

	logger.info(`🏁 Global reindex completed. Processed: ${results.processed}, Errors: ${results.errors.length}`);

	revalidatePath('/folders');

	return results;
}
