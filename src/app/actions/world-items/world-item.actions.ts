'use server';

import { worldItemsCache } from '@/lib/cache';
import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { EventType } from '@/lib/server/events.server';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import { revalidatePath } from 'next/cache';

// Importar tipos y transformers
import {
	extendWorldItem,
	extendWorldItems,
	prepareCreateWorldItemData,
	prepareUpdateWorldItemData
} from '@/transformers/world-item';
import {
	type CreateWorldItemData,
	type UpdateWorldItemData,
	type WorldItem,
	type WorldItemBase,
	WorldItemWithRelations
} from '@/types/entities/world-item';

// Configuración y utilidades
const worldItemLogger = serverLogger.withContext('WorldItemActions');
const REVALIDATE_PATHS = ['/settings', '/world-items', '/world-items/[id]'] as const;

// Códigos de error
enum WorldItemErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	OPERATION_FAILED = 'OPERATION_FAILED',
}

// Función creadora de errores (enfoque funcional)
const createWorldItemError = (
	message: string,
	code: WorldItemErrorCode = WorldItemErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'WorldItemError';
	Object.assign(error, { code, cause });
	return error;
};

// Interfaces adicionales para compatibilidad y extensión
export interface WorldItemWithStats extends WorldItemBase {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	recentImages: string[];
}

export interface WorldItemWithImages extends WorldItemBase {
	images: FileItem[];
}

// Funciones utilitarias
const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	worldItemLogger.info('🔄 Rutas revalidadas');
};

const notifyWorldItemChange = async (
	action: 'create' | 'update' | 'delete' | 'addImage' | 'removeImage',
	worldItemId: string,
	worldItem?: WorldItem,
	imageId?: string
) => {
	// Emitir eventos generales
	if (action === 'create' || action === 'update' || action === 'delete') {
		await emit({
			type: 'world-items:modified' as EventType,
			...(worldItemId ? { id: worldItemId } : {}),
			data: {
				action,
				...(worldItem ? { item: worldItem } : {}),
			},
		});
	} else if (imageId) {
		// Para acciones relacionadas con imágenes
		await emit({
			type: 'world-items:modified' as EventType,
			id: worldItemId,
			imageId,
			data: { action },
		});
	}

	// Actualizar estadísticas
	if (action === 'create' || action === 'update' || action === 'delete') {
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);
	} else {
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);
	}
};

// Acciones del servidor
/**
 * Obtiene todos los objetos del mundo
 */
export async function getWorldItems(): Promise<WorldItemWithStats[]> {
	const transformWorldItem = (worldItem: WorldItemBase & { _count: { images: number } }): WorldItemWithStats => ({
		...worldItem,
		totalSize: 0, // Valor por defecto, reemplazar si es necesario
		lastUpdated: new Date(worldItem.updatedAt || worldItem.createdAt), // Usamos updatedAt si existe
		recentImages: [], // Valor por defecto
		_count: worldItem._count
	});

	const cached = await worldItemsCache.get('all');
	if (cached) {
		worldItemLogger.info('✅ Objetos del mundo obtenidos de caché');
		// Convertir los datos del caché al formato esperado
		const items = cached.map((item) => ({
			...item,
			createdAt: new Date(item.createdAt as string),
			updatedAt: new Date(item.updatedAt as string),
			_count: { images: (item.imageCount as number) || 0 },
		})) as Array<WorldItemBase & { _count: { images: number } }>;
		return items.map(transformWorldItem);
	}

	try {
		worldItemLogger.info('🔍 Obteniendo objetos del mundo');
	const worldItems = await prisma.worldItem.findMany({
		include: {
			_count: {
				select: {
					images: true,
				},
			},
				images: {
					take: 5,
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						thumbnail: true,
						thumbnailWidth: true,
						thumbnailHeight: true,
						thumbnailSize: true,
					},
				},
			},
			orderBy: { updatedAt: 'desc' },
		});

		// Obtener datos estadísticos
		const worldItemsWithStats = await Promise.all(
			worldItems.map(async (worldItem) => {
				// Calcular tamaño total
				const totalSize = await prisma.image.aggregate({
					where: {
						worldItems: {
							some: {
								id: worldItem.id,
							},
						},
					},
					_sum: {
						size: true,
		},
	});

				// Convertir thumbnails a formatos legibles
				const recentImages = worldItem.images
					.filter((img) => img.thumbnail && img.thumbnailSize && img.thumbnailSize < 100000)
					.map((img) => {
						if (img.thumbnail) {
							return `data:image/jpeg;base64,${Buffer.from(img.thumbnail).toString('base64')}`;
						}
						return '';
					})
					.filter(Boolean);

				// Transformar el objeto
				const result = transformWorldItem({
					...worldItem,
					_count: worldItem._count,
				});

				result.totalSize = totalSize._sum.size || 0;
				result.recentImages = recentImages;

				return result;
			})
		);

		// Guardar en caché
		await worldItemsCache.set(
			'all',
			worldItemsWithStats.map((item) => ({
				...item,
		imageCount: item._count.images,
				_count: undefined,
			}))
		);

		worldItemLogger.info('✅ Objetos del mundo obtenidos', { count: worldItemsWithStats.length });
		return worldItemsWithStats;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objetos del mundo', error);
		throw createWorldItemError('No se pudieron obtener los objetos del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene un objeto del mundo por su ID
 */
export async function getWorldItemById(id: string): Promise<WorldItem> {
	try {
		worldItemLogger.info('🔍 Obteniendo objeto del mundo:', id);
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
						notes: true,
						concepts: true,
						prompts: true,
					},
				},
			},
		});

		if (!worldItem) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		worldItemLogger.info('✅ Objeto del mundo obtenido:', worldItem.name);

		// Transformar con los nuevos transformers
		return extendWorldItem(worldItem);
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudo obtener el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo objeto del mundo
 */
export async function createWorldItem(data: CreateWorldItemData): Promise<WorldItem> {
	try {
		worldItemLogger.info('📝 Creando objeto del mundo:', data.name);

		// Usar el transformer para preparar los datos
		const preparedData = prepareCreateWorldItemData(data);

		const worldItem = await prisma.worldItem.create({
			data: preparedData,
		});

		await notifyWorldItemChange('create', worldItem.id, worldItem);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Objeto del mundo creado:', worldItem.name);

		// Transformar con los nuevos transformers
		return extendWorldItem(worldItem);
	} catch (error) {
		worldItemLogger.error('❌ Error al crear objeto del mundo', error);
		throw createWorldItemError('No se pudo crear el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un objeto del mundo existente
 */
export async function updateWorldItem(id: string, data: UpdateWorldItemData): Promise<WorldItem> {
	try {
		worldItemLogger.info('📝 Actualizando objeto del mundo:', id);

		// Verificar que el objeto existe
		const existing = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existing) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Usar el transformer para preparar los datos
		const preparedData = prepareUpdateWorldItemData(data);

		// Actualizar el objeto
		const updated = await prisma.worldItem.update({
			where: { id },
			data: preparedData,
		});

		await notifyWorldItemChange('update', id, updated);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Objeto del mundo actualizado:', updated.name);

		// Transformar con los nuevos transformers
		return extendWorldItem(updated);
	} catch (error) {
		worldItemLogger.error('❌ Error al actualizar objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudo actualizar el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un objeto del mundo
 */
export async function deleteWorldItem(id: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🗑️ Eliminando objeto del mundo:', id);

		// Verificar que el objeto existe
		const existing = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existing) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Primero desconectar todas las relaciones
		await prisma.$transaction([
			prisma.worldItem.update({
				where: { id },
				data: {
					images: { set: [] },
					notes: { set: [] },
					concepts: { set: [] },
					prompts: { set: [] },
				},
			}),
			prisma.worldItem.delete({
			where: { id },
			}),
		]);

		await notifyWorldItemChange('delete', id);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Objeto del mundo eliminado');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudo eliminar el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Obtiene las imágenes asociadas a un objeto del mundo
 */
export async function getWorldItemImages(id: string): Promise<FileItem[]> {
	try {
		worldItemLogger.info('🖼️ Obteniendo imágenes para objeto del mundo:', id);

		// Verificar que el objeto existe
		const existing = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existing) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Obtener imágenes asociadas
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			include: {
				images: true,
			},
		});

		if (!worldItem) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Convertir imágenes a FileItem
		const images = worldItem.images.map((image) => convertServerImageToFileItem(image as unknown as ServerImage));

		worldItemLogger.info('✅ Imágenes obtenidas para objeto del mundo', { count: images.length });
		return images;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener imágenes para objeto del mundo', { id, error });
		// Preservar el código de error si ya es un WorldItemError
		if (error instanceof Error && 'code' in error) {
			throw error;
		}
		throw createWorldItemError('No se pudieron obtener las imágenes', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Asocia una imagen a un objeto del mundo
 */
export async function addImageToWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🖼️ Agregando imagen a objeto del mundo', { worldItemId, imageId });

		// Actualizar la relación
		await prisma.worldItem.update({
			where: { id: worldItemId },
			data: {
				images: {
					connect: { id: imageId },
				},
			},
		});

		await notifyWorldItemChange('addImage', worldItemId, undefined, imageId);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Imagen agregada a objeto del mundo');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al agregar imagen a objeto del mundo', { worldItemId, imageId, error });
		throw createWorldItemError('No se pudo agregar la imagen al objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Desasocia una imagen de un objeto del mundo
 */
export async function removeImageFromWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	try {
		worldItemLogger.info('🖼️ Eliminando imagen de objeto del mundo', { worldItemId, imageId });

		// Actualizar la relación
		await prisma.worldItem.update({
			where: { id: worldItemId },
			data: {
				images: {
					disconnect: { id: imageId },
				},
			},
		});

		await notifyWorldItemChange('removeImage', worldItemId, undefined, imageId);
		await revalidateAllPaths();

		worldItemLogger.info('✅ Imagen eliminada de objeto del mundo');
		return { success: true };
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar imagen de objeto del mundo', { worldItemId, imageId, error });
		throw createWorldItemError('No se pudo eliminar la imagen del objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}
