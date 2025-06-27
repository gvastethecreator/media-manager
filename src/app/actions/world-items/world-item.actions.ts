'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import {
    addImageToWorldItem as addImageToWorldItemService,
    createWorldItem as createWorldItemService,
    deleteWorldItem as deleteWorldItemService,
    getWorldItemImages as getWorldItemImagesService,
    getWorldItems as getWorldItemsService,
    getWorldItemWithStatsById as getWorldItemWithStatsByIdService,
    removeImageFromWorldItem as removeImageFromWorldItemService,
    updateWorldItem as updateWorldItemService,
} from '@/services/world-item';
import type { ImageComplete } from '@/types/entities/image';
import type {
    WorldItemComplete,
    WorldItemCreateInput,
    WorldItemSearchOptions,
    WorldItemUpdateInput,
    WorldItemWithStats,
} from '@/types/entities/world-item';
import { revalidatePath } from 'next/cache';

const worldItemLogger = serverLogger.withContext('WorldItemActions');

const REVALIDATE_PATHS = ['/settings/world-items', '/library/world-items'] as const;

const revalidateAllPaths = async (id?: string) => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	if (id) {
		revalidatePath(`/library/world-items/${id}`);
	}
	worldItemLogger.info('🔄 Rutas revalidadas');
};

/**
 * Obtiene todos los world items con estadísticas
 */
export async function getWorldItems(options: WorldItemSearchOptions = {}): Promise<WorldItemWithStats[]> {
	const worldItems = await getWorldItemsService(options);
	return worldItems;
}

/**
 * Obtiene un world item específico por ID con estadísticas
 */
export async function getWorldItemById(id: string): Promise<WorldItemWithStats | null> {
	const worldItem = await getWorldItemWithStatsByIdService(id);
	return worldItem;
}

/**
 * Crea un nuevo world item
 */
export async function createWorldItem(input: WorldItemCreateInput): Promise<WorldItemComplete> {
	const worldItem = await createWorldItemService(input);
	await revalidateAllPaths();
	return worldItem;
}

/**
 * Actualiza un world item existente
 */
export async function updateWorldItem(id: string, input: WorldItemUpdateInput): Promise<WorldItemComplete> {
	const worldItem = await updateWorldItemService(id, input);
	await revalidateAllPaths(id);
	return worldItem;
}

/**
 * Elimina un world item
 */
export async function deleteWorldItem(id: string): Promise<{ success: boolean }> {
	const result = await deleteWorldItemService(id);
	await revalidateAllPaths();
	return result;
}

/**
 * Obtiene las imágenes de un world item
 */
export async function getWorldItemImages(worldItemId: string): Promise<{ images: ImageComplete[] }> {
	const result = await getWorldItemImagesService(worldItemId);
	return result;
}

/**
 * Agrega una imagen a un world item
 */
export async function addImageToWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	const result = await addImageToWorldItemService(worldItemId, imageId);
	await revalidateAllPaths(worldItemId);
	return result;
}

/**
 * Elimina una imagen de un world item
 */
export async function removeImageFromWorldItem(worldItemId: string, imageId: string): Promise<{ success: boolean }> {
	const result = await removeImageFromWorldItemService(worldItemId, imageId);
	await revalidateAllPaths(worldItemId);
	return result;
}
