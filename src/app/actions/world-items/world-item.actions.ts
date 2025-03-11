'use server';

import { worldItemsCache } from '@/lib/cache';
import { logger } from '@/lib/logger/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Image, WorldItem as PrismaWorldItem } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const worldItemLogger = logger.withContext('WorldItemActions');

const REVALIDATE_PATHS = ['/settings', '/world-items', '/world-items/[id]'] as const;

const revalidateAllPaths = async () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	worldItemLogger.info('🔄 Rutas revalidadas');
};

class WorldItemError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'WorldItemError';
	}
}

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
	category: string;
	properties: string;
	featuredImage?: string | null;
}

export interface WorldItemUpdate extends Partial<WorldItemCreate> {
	id: string;
}

export interface WorldItemWithImages extends PrismaWorldItem {
	images: FileItem[];
}

export interface ExtendedWorldItem extends PrismaWorldItem {
	images: Image[];
}

/**
 * Obtiene todos los objetos del mundo
 */
export async function getWorldItems() {
	try {
		// Verificar si existe en caché
		const cached = await worldItemsCache.get('all');
		if (cached) {
			worldItemLogger.info('✅ Objetos del mundo obtenidos de caché');
			return cached as Array<PrismaWorldItem & { _count: { images: number } }>;
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

		// Almacenar en caché
		await worldItemsCache.set('all', worldItems);

		return worldItems;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objetos del mundo:', error);
		throw new WorldItemError('No se pudieron obtener los objetos del mundo', error);
	}
}

export async function getWorldItemById(id: string) {
	try {
		worldItemLogger.info('🔍 Buscando objeto del mundo:', id);
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
			throw new WorldItemError('Objeto del mundo no encontrado');
		}

		worldItemLogger.info('✅ Objeto del mundo encontrado:', worldItem.name);
		return worldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener objeto del mundo:', error);
		throw new WorldItemError('No se pudo obtener el objeto del mundo', error);
	}
}

/**
 * Crea un nuevo objeto del mundo
 */
export async function createWorldItem(data: WorldItemCreate): Promise<PrismaWorldItem> {
	try {
		worldItemLogger.info('🆕 Creando nuevo objeto del mundo:', data);

		const worldItem = await prisma.worldItem.create({
			data: {
				name: data.name,
				emoji: data.emoji || '🧩',
				description: data.description || null,
				color: data.color || '#3b82f6',
				category: data.category || null,
				type: data.type || null,
				rarity: data.rarity || null,
				properties: data.properties || '[]',
				requirements: data.requirements || '{}',
				origin: data.origin || null,
				stats: data.stats || '{}',
			},
		});

		// Invalidar caché
		await worldItemsCache.delete('all');

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			data: { action: 'create', item: worldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ Nuevo objeto del mundo creado:', worldItem.id);

		await revalidateAllPaths();
		return worldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al crear objeto del mundo:', error);
		throw new WorldItemError('No se pudo crear el objeto del mundo', error);
	}
}

/**
 * Actualiza un objeto del mundo existente
 */
export async function updateWorldItem(id: string, data: WorldItemUpdate) {
	try {
		worldItemLogger.info('🔄 Actualizando objeto del mundo:', id);

		// Verificar que el objeto del mundo existe
		const existingWorldItem = await prisma.worldItem.findUnique({
			where: { id },
		});

		if (!existingWorldItem) {
			throw new WorldItemError(`El objeto del mundo con ID ${id} no existe`);
		}

		// Actualizar el objeto del mundo
		const updatedWorldItem = await prisma.worldItem.update({
			where: { id },
			data,
		});

		// Invalidar caché
		await worldItemsCache.delete('all');
		await worldItemsCache.delete(id);

		// Emitir eventos
		await emit({
			type: 'world-items:modified',
			id,
			data: { action: 'update', item: updatedWorldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ Objeto del mundo actualizado:', id);
		await revalidateAllPaths();

		return updatedWorldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al actualizar objeto del mundo:', error);
		throw new WorldItemError('No se pudo actualizar el objeto del mundo', error);
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
			throw new WorldItemError(`El objeto del mundo con ID ${id} no existe`);
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
		await emit({
			type: 'world-items:modified',
			id,
			data: { action: 'delete', item: deletedWorldItem },
		});
		statsEventEmitter.emit(STATS_EVENTS.WORLD_ITEM_CHANGE);

		worldItemLogger.info('✅ Objeto del mundo eliminado:', id);
		await revalidateAllPaths();

		return deletedWorldItem;
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar objeto del mundo:', error);
		throw new WorldItemError('No se pudo eliminar el objeto del mundo', error);
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
			throw new WorldItemError('Objeto del mundo no encontrado');
		}

		const images = worldItem.images.map((img) => convertServerImageToFileItem(img as ServerImage));

		worldItemLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		worldItemLogger.error('❌ Error al obtener imágenes del objeto del mundo:', error);
		throw new WorldItemError('No se pudieron obtener las imágenes del objeto del mundo', error);
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

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'world-items:modified',
			id: worldItemId,
			imageId,
			data: { action: 'addImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		worldItemLogger.info('✅ Imagen agregada al objeto del mundo');
		await revalidateAllPaths();
	} catch (error) {
		worldItemLogger.error('❌ Error al agregar imagen al objeto del mundo:', error);
		throw new WorldItemError('No se pudo agregar la imagen al objeto del mundo', error);
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

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'world-items:modified',
			id: worldItemId,
			imageId,
			data: { action: 'removeImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		worldItemLogger.info('✅ Imagen eliminada del objeto del mundo');
		await revalidateAllPaths();
	} catch (error) {
		worldItemLogger.error('❌ Error al eliminar imagen del objeto del mundo:', error);
		throw new WorldItemError('No se pudo eliminar la imagen del objeto del mundo', error);
	}
}
