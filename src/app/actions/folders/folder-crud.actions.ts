'use server';

import { existsSync } from 'fs';
import { serverLogger } from '@/lib/logger/server-logger';
import { normalizePath } from '@/lib/path-utils';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { fsService } from '@/services/fs.server';
import { indexFolder } from './folder-indexing.actions';
import { FolderError, type FolderResponse, type FolderUpdate, type ImageWithRelations } from './folder-types.actions';
import { revalidateAllPaths } from './folder-utils.actions';

const folderLogger = serverLogger.withContext('FolderCRUD');

/**
 * Obtiene todas las carpetas registradas
 */
export async function getFolders() {
	try {
		folderLogger.info('📁 Iniciando obtención de carpetas');
		const folders = await prisma.folder.findMany({
			include: {
				_count: {
					select: { images: true },
				},
				images: {
					take: 9,
					orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
					select: {
						id: true,
						name: true,
						path: true,
						size: true,
						width: true,
						height: true,
						metadata: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
						isPublic: true,
						isFavorite: true,
						folderId: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
			orderBy: { name: 'asc' },
		});

		folderLogger.info('✅ Carpetas obtenidas', { count: folders.length });
		return folders.map((folder) => ({
			...folder,
			recentImages: Array(9)
				.fill(null)
				.map((_, index) => {
					const img = folder.images[index];
					if (img?.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000) {
						try {
							return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
						} catch (error) {
							folderLogger.error('❌ Error convirtiendo thumbnail a base64:', error);
							return null;
						}
					}
					return null;
				}),
			images: undefined, // Removemos las imágenes completas para no enviar datos innecesarios
		}));
	} catch (error) {
		folderLogger.error('❌ Error al obtener carpetas', error);
		throw new FolderError('No se pudieron obtener las carpetas', { cause: error });
	}
}

/**
 * Obtiene una carpeta específica por su ID
 */
export async function getFolder(id: string) {
	try {
		folderLogger.info('🔍 Obteniendo carpeta:', id);
		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		if (!folder) {
			folderLogger.warn('❌ Carpeta no encontrada:', id);
			throw new FolderError('Carpeta no encontrada');
		}

		folderLogger.info('✅ Carpeta obtenida:', folder.name);
		return folder;
	} catch (error) {
		folderLogger.error('❌ Error al obtener carpeta:', error);
		if (error instanceof FolderError) {
			throw error;
		}
		throw new FolderError('No se pudo obtener la carpeta', error);
	}
}

/**
 * Crea una nueva carpeta
 */
export async function createFolder(path: string) {
	try {
		folderLogger.info('📁 Agregando nueva carpeta:', path);

		if (!path) {
			throw new FolderError('PATH_REQUIRED');
		}

		// Validar y normalizar la ruta
		const normalizedPath = normalizePath(path);
		folderLogger.info('Path normalizado:', { original: path, normalized: normalizedPath });

		if (!existsSync(normalizedPath)) {
			throw new FolderError('PATH_NOT_FOUND');
		}

		// Verificar si la carpeta ya existe
		const existingFolder = await prisma.folder.findFirst({
			where: { path: normalizedPath },
		});

		if (existingFolder) {
			throw new FolderError('FOLDER_EXISTS');
		}

		// Crear carpeta en la base de datos
		const folder = await prisma.folder.create({
			data: {
				path: normalizedPath,
				name: normalizedPath.split('\\').pop() || normalizedPath,
				lastIndexed: new Date(),
			},
		});

		folderLogger.info('✅ Carpeta creada:', folder);

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'folders:modified',
			data: { action: 'create', folder },
		});

		await revalidateAllPaths();

		return folder;
	} catch (error) {
		folderLogger.error('❌ Error al crear carpeta:', error);
		if (error instanceof FolderError) {
			throw error;
		}
		throw new FolderError('No se pudo crear la carpeta', error);
	}
}

/**
 * Actualiza una carpeta existente
 */
export async function updateFolder(id: string, data: FolderUpdate) {
	try {
		folderLogger.info('📝 Actualizando carpeta:', { id, data });

		const folder = await prisma.folder.update({
			where: { id },
			data,
		});

		folderLogger.info('✅ Carpeta actualizada:', folder);

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'folders:modified',
			data: { action: 'update', folder },
		});

		await revalidateAllPaths();

		return folder;
	} catch (error) {
		folderLogger.error('❌ Error al actualizar carpeta:', error);
		throw new FolderError('No se pudo actualizar la carpeta', error);
	}
}

/**
 * Elimina una carpeta
 */
export async function deleteFolder(id: string) {
	try {
		folderLogger.info('🗑️ Eliminando carpeta:', id);

		const folder = await prisma.folder.delete({
			where: { id },
		});

		folderLogger.info('✅ Carpeta eliminada:', folder);

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'folders:modified',
			data: { action: 'delete', folder },
		});

		await revalidateAllPaths();

		return folder;
	} catch (error) {
		folderLogger.error('❌ Error al eliminar carpeta:', error);
		throw new FolderError('No se pudo eliminar la carpeta', error);
	}
}

/**
 * Obtiene todas las imágenes de una carpeta
 */
export async function getFolderImages(id: string) {
	try {
		folderLogger.info('🔍 Buscando imágenes de la carpeta:', id);

		const folder = await prisma.folder.findUnique({
			where: { id },
			include: {
				images: {
					orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
					include: {
						collections: {
							select: { id: true, name: true },
						},
						tags: {
							select: { id: true, name: true },
						},
						albums: {
							select: { id: true, name: true },
						},
						characters: {
							select: { id: true, name: true },
						},
						places: {
							select: { id: true, name: true },
						},
						worldItems: {
							select: { id: true, name: true },
						},
					},
				},
			},
		});

		if (!folder) {
			throw new FolderError('Carpeta no encontrada');
		}

		// Uso de Promise.all para esperar a que todas las promesas se resuelvan
		const transformPromises = folder.images.map((image) =>
			transformImageToFileItem(image as unknown as ImageWithRelations)
		);

		const transformedImages = await Promise.all(transformPromises);

		folderLogger.info('✅ Imágenes obtenidas:', transformedImages.length);
		return transformedImages;
	} catch (error) {
		folderLogger.error('Error obteniendo imágenes:', error);
		if (error instanceof FolderError) {
			throw error;
		}
		throw new FolderError('Error al obtener las imágenes', error);
	}
}

/**
 * Actualiza el estado de auto-reindexado de una carpeta
 */
export async function updateFolderAutoReindex(id: string, autoReindex: boolean) {
	folderLogger.info(`Actualizando auto-reindexado para carpeta ${id}: ${autoReindex}`);

	try {
		const folder = await prisma.folder.update({
			where: { id },
			data: { autoReindex },
		});

		// Emitir evento de modificación de carpeta
		emit({
			type: 'folders:modified',
			data: {
				action: 'update',
				folder: {
					id: folder.id,
					name: folder.name,
					path: folder.path,
					totalFiles: folder.totalFiles,
					totalSize: Number(folder.totalSize),
					lastIndexed: folder.lastIndexed?.toISOString() || null,
					createdAt: folder.createdAt.toISOString(),
					updatedAt: folder.updatedAt.toISOString(),
					autoReindex: folder.autoReindex,
				},
			},
		});

		// Revalidar rutas
		await revalidateAllPaths();

		return {
			folder: {
				id: folder.id,
				name: folder.name,
				path: folder.path,
				totalFiles: folder.totalFiles,
				totalSize: Number(folder.totalSize),
				lastIndexed: folder.lastIndexed?.toISOString() || null,
				createdAt: folder.createdAt.toISOString(),
				updatedAt: folder.updatedAt.toISOString(),
				autoReindex: folder.autoReindex,
			},
			timestamp: Date.now(),
		};
	} catch (error) {
		folderLogger.error('Error actualizando auto-reindexado de carpeta:', error);
		throw new FolderError('No se pudo actualizar la configuración de auto-reindexado de la carpeta', error);
	}
}

// Importamos esta función del archivo folder-utils
import { transformImageToFileItem } from './folder-utils.actions';
