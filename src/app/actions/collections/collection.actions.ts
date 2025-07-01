'use server';

/**
 * @file Server Actions para la entidad Collection
 * @module app/actions/collections/collection.actions
 * @description Controladores delgados que llaman al servicio de colecciones
 * @updated 2025-01-27
 */

import { serverLogger } from '@/lib/logger/server-logger';
import collectionService from '@/services/collection';
import type {
	CollectionCreateInput,
	CollectionSearchOptions,
	CollectionUpdateInput,
	CollectionWithStats,
} from '@/types/entities/collection';

const logger = serverLogger.withContext('CollectionActions');

/**
 * Busca y obtiene colecciones según los criterios de búsqueda.
 */
export async function searchCollections(options: CollectionSearchOptions): Promise<CollectionWithStats[]> {
	try {
		logger.info('🔍 Buscando colecciones via action', { options });
		return await collectionService.searchCollections(options);
	} catch (error) {
		logger.error('❌ Error en action searchCollections', { error, options });
		throw error;
	}
}

/**
 * Obtiene todas las colecciones.
 */
export async function getCollections(): Promise<CollectionWithStats[]> {
	try {
		logger.info('📚 Obteniendo colecciones via action');
		return await collectionService.getCollections();
	} catch (error) {
		logger.error('❌ Error en action getCollections', { error });
		throw error;
	}
}

/**
 * Obtiene una única colección por su ID.
 */
export async function getCollection(id: string): Promise<CollectionWithStats | null> {
	try {
		logger.info(`🔍 Obteniendo colección ${id} via action`);
		return await collectionService.getCollection(id);
	} catch (error) {
		logger.error(`❌ Error en action getCollection: ${id}`, { error });
		throw error;
	}
}

/**
 * Crea una nueva colección.
 */
export async function createCollection(data: CollectionCreateInput): Promise<CollectionWithStats> {
	try {
		logger.info('➕ Creando colección via action', { name: data.name });
		return await collectionService.createCollection(data);
	} catch (error) {
		logger.error('❌ Error en action createCollection', { error, data });
		throw error;
	}
}

/**
 * Actualiza una colección existente.
 */
export async function updateCollection(id: string, data: CollectionUpdateInput): Promise<CollectionWithStats> {
	try {
		logger.info(`🔄 Actualizando colección ${id} via action`);
		return await collectionService.updateCollection(id, data);
	} catch (error) {
		logger.error(`❌ Error en action updateCollection: ${id}`, { error, data });
		throw error;
	}
}

/**
 * Elimina una colección.
 */
export async function deleteCollection(id: string): Promise<void> {
	try {
		logger.warn(`🗑️ Eliminando colección ${id} via action`);
		await collectionService.deleteCollection(id);
	} catch (error) {
		logger.error(`❌ Error en action deleteCollection: ${id}`, { error });
		throw error;
	}
}

/**
 * Obtiene las imágenes asociadas a una colección.
 */
export async function getCollectionImages(collectionId: string): Promise<{ id: string; name: string; path: string }[]> {
	try {
		logger.info(`🖼️ Obteniendo imágenes de colección ${collectionId} via action`);
		return await collectionService.getCollectionImages(collectionId);
	} catch (error) {
		logger.error(`❌ Error en action getCollectionImages: ${collectionId}`, { error });
		throw error;
	}
}

/**
 * Cambia el estado de favorito de una colección.
 */
export async function toggleCollectionFavorite(id: string): Promise<CollectionWithStats> {
	try {
		logger.info(`⭐ Cambiando favorito de colección ${id} via action`);
		return await collectionService.toggleCollectionFavorite(id);
	} catch (error) {
		logger.error(`❌ Error en action toggleCollectionFavorite: ${id}`, { error });
		throw error;
	}
}

/**
 * Agrega una imagen a una colección.
 */
export async function addImageToCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando imagen ${imageId} a colección ${collectionId} via action`);
		// Nota: Esta función necesita ser implementada en el servicio
		logger.warn(`⚠️ addImageToCollection no implementada para ${collectionId}-${imageId}`);
	} catch (error) {
		logger.error('❌ Error en action addImageToCollection', { error, collectionId, imageId });
		throw error;
	}
}

/**
 * Remueve una imagen de una colección.
 */
export async function removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo imagen ${imageId} de colección ${collectionId} via action`);
		// Nota: Esta función necesita ser implementada en el servicio
		logger.warn(`⚠️ removeImageFromCollection no implementada para ${collectionId}-${imageId}`);
	} catch (error) {
		logger.error('❌ Error en action removeImageFromCollection', { error, collectionId, imageId });
		throw error;
	}
}

/**
 * Agrega una colección a una imagen.
 */
export async function addCollectionToImage(imageId: string, collectionId: string): Promise<void> {
	try {
		logger.info(`🔗 Agregando colección ${collectionId} a imagen ${imageId} via action`);
		// Nota: Esta función necesita ser implementada en el servicio
		logger.warn(`⚠️ addCollectionToImage no implementada para ${imageId}-${collectionId}`);
	} catch (error) {
		logger.error('❌ Error en action addCollectionToImage', { error, imageId, collectionId });
		throw error;
	}
}

/**
 * Remueve una colección de una imagen.
 */
export async function removeCollectionFromImage(imageId: string, collectionId: string): Promise<void> {
	try {
		logger.info(`🔗 Removiendo colección ${collectionId} de imagen ${imageId} via action`);
		// Nota: Esta función necesita ser implementada en el servicio
		logger.warn(`⚠️ removeCollectionFromImage no implementada para ${imageId}-${collectionId}`);
	} catch (error) {
		logger.error('❌ Error en action removeCollectionFromImage', { error, imageId, collectionId });
		throw error;
	}
}
