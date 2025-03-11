'use server';

import { worldItemsCache } from '@/lib/cache';
import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { EventType } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Image, WorldItem as PrismaWorldItem } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Configuración y utilidades
const worldItemLogger = logger.withContext('WorldItemActions');
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

// Interfaces
export interface WorldItemWithStats extends Omit<PrismaWorldItem, 'featuredImage'> {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	featuredImage: string | null;
	recentImages: string[];
}

export interface WorldItemCreate {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	category?: string;
	properties?: string;
	rarity?: string | null;
	origin?: string | null;
	stats?: string;
	requirements?: string;
	type?: string | null;
	featuredImage?: string | null;
}

export interface WorldItemUpdate {
	id: string;
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	category?: string;
	properties?: string;
	rarity?: string;
	origin?: string;
	stats?: string;
	requirements?: string;
	type?: string;
	featuredImage?: string | null;
}

export interface WorldItemWithImages extends PrismaWorldItem {
	images: FileItem[];
}

export interface ExtendedWorldItem extends PrismaWorldItem {
	images: Image[];
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
	worldItem?: PrismaWorldItem,
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
export async function getWorldItems() {
	try {
		// Verificar si existe en caché
		const cached = await worldItemsCache.get('all');
		if (cached) {
			worldItemLogger.info('✅ Objetos del mundo obtenidos de caché');
			// Convertimos explícitamente a tipo unknown primero para evitar errores de tipo
			return cached as unknown as Array<PrismaWorldItem & { _count: { images: number } }>;
		}

		const worldItems = await prisma.worldItem.findMany({
			orderBy: {
				createdAt: 'desc',
			},
			include: {
				_count: {
					select: {
						images: true,
					},
				},
			},
		});

		// Almacenar en caché - usar tipo correcto para evitar errores
		// Nota: como la estructura de la caché puede ser diferente,
		// hacemos la conversión de tipos de manera segura
		await worldItemsCache.set('all', JSON.parse(JSON.stringify(worldItems)));

		return worldItems;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objetos del mundo:', error);
		throw createWorldItemError(
			'No se pudieron obtener los objetos del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function getWorldItemById(id: string) {
	try {
		worldItemLogger.info('🔍 Buscando objeto del mundo:', id);

		// Verificar si existe en caché
		const cached = await worldItemsCache.get(id);
		if (cached) {
			worldItemLogger.info('✅ Objeto del mundo obtenido de caché');
			return cached as unknown as PrismaWorldItem & {
				_count: { images: number };
				images: { id: string; name: string }[];
			};
		}

		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					take: 5,
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!worldItem) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		// Guardar en caché
		await worldItemsCache.set(id, JSON.parse(JSON.stringify(worldItem)));

		worldItemLogger.info('✅ Objeto del mundo encontrado:', worldItem.name);
		return worldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError('No se pudo obtener el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Crea un nuevo objeto del mundo
 */
export async function createWorldItem(data: WorldItemCreate): Promise<PrismaWorldItem> {
	try {
		worldItemLogger.info('🆕 Creando nuevo objeto del mundo:', data);

		// Validación de entrada
		if (!data.name?.trim()) {
			throw createWorldItemError('El nombre del objeto es requerido', WorldItemErrorCode.VALIDATION_ERROR);
		}

		const worldItem = await prisma.worldItem.create({
			data: {
				name: data.name,
				emoji: data.emoji || '🧩',
				description: data.description || null,
				color: data.color || '#3b82f6',
				// Usar operador de optional chaining para los campos opcionales
				...(data.category && { category: data.category }),
				...(data.type && { type: data.type }),
				...(data.rarity && { rarity: data.rarity }),
				properties: data.properties || '[]',
				...(data.requirements && { requirements: data.requirements }),
				...(data.origin && { origin: data.origin }),
				...(data.stats && { stats: data.stats }),
				featuredImage: data.featuredImage || null,
			},
		});

		// Invalidar caché
		await worldItemsCache.delete('all');

		// Emitir eventos
		await notifyWorldItemChange('create', worldItem.id, worldItem);

		worldItemLogger.info('✅ Nuevo objeto del mundo creado:', worldItem.id);

		await revalidateAllPaths();
		return worldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al crear objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError('No se pudo crear el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Actualiza un objeto del mundo existente
 */
export async function updateWorldItem(id: string, data: WorldItemUpdate) {
	try {
		worldItemLogger.info('🔄 Actualizando objeto del mundo:', id);

		// Validación de entrada
		if (data.name === '') {
			throw createWorldItemError('El nombre del objeto no puede estar vacío', WorldItemErrorCode.VALIDATION_ERROR);
		}

		// Verificar que el objeto del mundo existe
		const existingWorldItem = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existingWorldItem) {
			throw createWorldItemError(`El objeto del mundo con ID ${id} no existe`, WorldItemErrorCode.NOT_FOUND);
		}

		// Extraer el ID y preparar los datos para actualización
		const { id: _, ...updateData } = data;

		// Actualizar el objeto del mundo
		const updatedWorldItem = await prisma.worldItem.update({
			where: { id },
			data: updateData,
		});

		// Invalidar caché
		await worldItemsCache.delete('all');
		await worldItemsCache.delete(id);

		// Emitir eventos
		await notifyWorldItemChange('update', id, updatedWorldItem);

		worldItemLogger.info('✅ Objeto del mundo actualizado:', id);
		await revalidateAllPaths();

		return updatedWorldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al actualizar objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError('No se pudo actualizar el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

/**
 * Elimina un objeto del mundo
 */
export async function deleteWorldItem(id: string) {
	try {
		worldItemLogger.info('🗑️ Eliminando objeto del mundo:', id);

		// Verificar que el objeto del mundo existe
		const existingWorldItem = await prisma.worldItem.findUnique({
			where: { id },
			include: { images: true },
		});

		if (!existingWorldItem) {
			throw createWorldItemError(`El objeto del mundo con ID ${id} no existe`, WorldItemErrorCode.NOT_FOUND);
		}

		// Eliminar las relaciones con imágenes
		if (existingWorldItem.images.length > 0) {
			await prisma.worldItem.update({
				where: { id },
				data: {
					images: {
						disconnect: existingWorldItem.images.map((image) => ({ id: image.id })),
					},
				},
			});
		}

		// Eliminar el objeto del mundo
		const deletedWorldItem = await prisma.worldItem.delete({
			where: { id },
		});

		// Invalidar caché
		await worldItemsCache.delete('all');
		await worldItemsCache.delete(id);

		// Emitir eventos
		await notifyWorldItemChange('delete', id, deletedWorldItem);

		worldItemLogger.info('✅ Objeto del mundo eliminado:', id);
		await revalidateAllPaths();

		return deletedWorldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError('No se pudo eliminar el objeto del mundo', WorldItemErrorCode.OPERATION_FAILED, error);
	}
}

export async function getWorldItemImages(id: string) {
	try {
		worldItemLogger.info('🖼️ Obteniendo imágenes del objeto del mundo:', id);
		const worldItem = (await prisma.worldItem.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: true,
						stats: true,
					},
				},
			},
		})) as ExtendedWorldItem | null;

		if (!worldItem) {
			throw createWorldItemError('Objeto del mundo no encontrado', WorldItemErrorCode.NOT_FOUND);
		}

		const images = worldItem.images.map((img) => convertServerImageToFileItem(img as ServerImage));

		worldItemLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener imágenes del objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError(
			'No se pudieron obtener las imágenes del objeto del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function addImageToWorldItem(worldItemId: string, imageId: string) {
	try {
		worldItemLogger.info('➕ Agregando imagen a objeto del mundo:', { worldItemId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				worldItems: {
					connect: { id: worldItemId },
				},
			},
		});

		// Emitir eventos usando la función de notificación
		await notifyWorldItemChange('addImage', worldItemId, undefined, imageId);

		worldItemLogger.info('✅ Imagen agregada al objeto del mundo');
		await revalidateAllPaths();
	} catch (error) {
		worldItemLogger.error('❌ Error al agregar imagen al objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError(
			'No se pudo agregar la imagen al objeto del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}

export async function removeImageFromWorldItem(worldItemId: string, imageId: string) {
	try {
		worldItemLogger.info('➖ Eliminando imagen de objeto del mundo:', { worldItemId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				worldItems: {
					disconnect: { id: worldItemId },
				},
			},
		});

		// Emitir eventos usando la función de notificación
		await notifyWorldItemChange('removeImage', worldItemId, undefined, imageId);

		worldItemLogger.info('✅ Imagen eliminada del objeto del mundo');
		await revalidateAllPaths();
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar imagen del objeto del mundo:', error);
		// Preservar el error si ya es un WorldItemError
		if (error instanceof Error && error.name === 'WorldItemError') {
			throw error;
		}
		throw createWorldItemError(
			'No se pudo eliminar la imagen del objeto del mundo',
			WorldItemErrorCode.OPERATION_FAILED,
			error
		);
	}
}
