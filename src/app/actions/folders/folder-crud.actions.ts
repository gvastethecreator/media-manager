'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { normalizePath } from '@/lib/path-utils';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { CreateFolderData, FolderBase, FolderExtended, UpdateFolderData } from '@/types/entities/folder';
import { existsSync } from 'fs';
import { revalidateAllPaths } from './folder-utils.actions';

const folderLogger = serverLogger.withContext('FolderCRUD');

// Clase de error para carpetas
class FolderError extends Error {
	constructor(message: string | { message: string; code: string }, context?: unknown) {
		const msg = typeof message === 'string' ? message : message.message;
		const code = typeof message === 'string' ? 'FOLDER_ERROR' : message.code;

		super(msg);
		this.name = 'FolderError';
		Object.defineProperty(this, 'code', { value: code });

		if (context) {
			Object.defineProperty(this, 'cause', { value: context });
		}
	}
}

/**
 * Obtiene todas las carpetas registradas
 */
export async function getFolders(): Promise<FolderExtended[]> {
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
				visualConfig: true,
			},
			orderBy: { name: 'asc' },
		});

		folderLogger.info('✅ Carpetas obtenidas', { count: folders.length });
		return folders.map((folder: any) => ({
			...folder,
			recentImages: Array(9)
				.fill(null)
				.map((_, index: number) => {
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
		throw new FolderError('No se pudieron obtener las carpetas', error);
	}
}

/**
 * Obtiene una carpeta específica por su ID
 */
export async function getFolder(id: string): Promise<FolderExtended | null> {
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
				visualConfig: true,
			},
		});

		if (!folder) {
			folderLogger.warn('ℹ️ Carpeta no encontrada, retornando null:', id);
			return null;
		}

		folderLogger.info('✅ Carpeta obtenida:', folder.name);
		return folder as FolderExtended;
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
export async function createFolder(path: string): Promise<FolderBase> {
	try {
		folderLogger.info('📁 Agregando nueva carpeta:', path);

		if (!path) {
			throw new FolderError({ message: 'La ruta es requerida', code: 'PATH_REQUIRED' });
		}

		// Validar y normalizar la ruta
		const normalizedPath = normalizePath(path);
		folderLogger.info('Path normalizado:', { original: path, normalized: normalizedPath });

		if (!existsSync(normalizedPath)) {
			throw new FolderError({ message: 'La ruta no existe', code: 'PATH_NOT_FOUND' });
		}

		// Verificar si la carpeta ya existe
		const existingFolder = await prisma.folder.findFirst({
			where: { path: normalizedPath },
		});

		if (existingFolder) {
			throw new FolderError({ message: 'La carpeta ya existe en la base de datos', code: 'FOLDER_EXISTS' });
		}

		// Crear carpeta en la base de datos
		const folderData: CreateFolderData = {
			path: normalizedPath,
			name: normalizedPath.split('\\').pop() || normalizedPath,
		};

		const folder = await prisma.folder.create({
			data: {
				...folderData,
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
export async function updateFolder(id: string, data: UpdateFolderData): Promise<FolderBase> {
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
export async function deleteFolder(id: string): Promise<void> {
	try {
		folderLogger.info('🗑️ Eliminando carpeta:', id);

		await prisma.folder.delete({
			where: { id },
		});

		folderLogger.info('✅ Carpeta eliminada');

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'folders:modified',
			data: { action: 'delete', id },
		});

		await revalidateAllPaths();
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
		folderLogger.info('🖼️ Obteniendo imágenes de carpeta:', id);
		const images = await prisma.image.findMany({
			where: { folderId: id },
			include: {
				tags: {
					select: { id: true, name: true, color: true },
				},
				collections: {
					select: { id: true, name: true, color: true, emoji: true },
				},
				stats: true,
			},
			orderBy: { name: 'asc' },
		});

		// Para depuración
		folderLogger.info(`✅ Obtenidas ${images.length} imágenes para carpeta ${id}`);

		// Optimización: Procesar thumbnails directamente antes de enviarlos
		// Esto evita tener que procesarlos en el cliente
		const processedImages = images.map(image => {
			// Si el thumbnail es muy grande, no lo enviamos para optimizar
			if (image.thumbnail && image.thumbnailSize && image.thumbnailSize > 200000) {
				folderLogger.warn(`Thumbnail demasiado grande para ${image.id}: ${image.thumbnailSize} bytes, eliminando...`);
				return {
					...image,
					thumbnail: null
				};
			}
			return image;
		});

		return processedImages;
	} catch (error) {
		folderLogger.error('❌ Error al obtener imágenes de carpeta:', error);
		throw new FolderError('No se pudieron obtener las imágenes de la carpeta', error);
	}
}

/**
 * Actualiza la configuración de reindexación automática
 */
export async function updateFolderAutoReindex(id: string, autoReindex: boolean): Promise<FolderBase> {
	try {
		folderLogger.info('⚙️ Actualizando configuración de reindexación automática:', {
			id,
			autoReindex,
		});

		const folder = await prisma.folder.update({
			where: { id },
			data: { autoReindex },
		});

		folderLogger.info('✅ Configuración actualizada');

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'folders:modified',
			data: { action: 'update', folder },
		});

		await revalidateAllPaths();

		return folder;
	} catch (error) {
		folderLogger.error('❌ Error al actualizar configuración:', error);
		throw new FolderError('No se pudo actualizar la configuración', error);
	}
}
