/**
 * @file Servicio para gestión de colecciones
 * @module services/collection
 * @description Implementación del servicio de gestión de colecciones
 */

import {
	addImageToCollection as addImageToCollectionAction,
	createCollection as createCollectionAction,
	deleteCollection as deleteCollectionAction,
	getCollection as getCollectionAction,
	getCollectionImages as getCollectionImagesAction,
	getCollections as getCollectionsAction,
	removeImageFromCollection as removeImageFromCollectionAction,
	updateCollection as updateCollectionAction,
} from '@/app/actions/collections/collection.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type {
	CollectionBase,
	CollectionComplete,
	CollectionExtended,
	CreateCollectionData,
	UpdateCollectionData,
} from '@/types/entities/collection';
import type { FileItem } from '@/types/files';

// Logger específico para el servicio
const logger = serverLogger.withContext('CollectionService');

// Eventos del servicio de colecciones
export const COLLECTION_EVENTS = {
	CREATED: 'collection:created',
	UPDATED: 'collection:updated',
	DELETED: 'collection:deleted',
	ITEMS_ADDED: 'collection:items:added',
	ITEMS_REMOVED: 'collection:items:removed',
	STATS_UPDATED: 'collection:stats:updated',
} as const;

/**
 * Clase de error personalizada para operaciones de Collection
 */
export class CollectionServiceError extends Error {
	constructor(
		message: string,
		public code?: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'CollectionServiceError';
	}
}

/**
 * Notifica cambios en las colecciones a través del sistema de eventos
 * @param action Tipo de acción realizada
 * @param collection Datos de la colección afectada
 */
export const notifyCollectionChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	collection: CollectionBase | CollectionComplete | { id: string }
) => {
	let eventType: string;

	switch (action) {
		case 'create':
			eventType = COLLECTION_EVENTS.CREATED;
			break;
		case 'update':
			eventType = COLLECTION_EVENTS.UPDATED;
			break;
		case 'delete':
			eventType = COLLECTION_EVENTS.DELETED;
			break;
		case 'items:add':
			eventType = COLLECTION_EVENTS.ITEMS_ADDED;
			break;
		case 'items:remove':
			eventType = COLLECTION_EVENTS.ITEMS_REMOVED;
			break;
		default:
			eventType = 'collection:modified';
	}

	// Emitir evento al sistema central
	await emit({
		type: eventType,
		data: { action, collection },
	});

	// Notificar a estadísticas
	statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);

	logger.info(`🔔 Notificado cambio en colección: ${action}`, { collectionId: collection.id });
};

/**
 * Obtiene todas las colecciones
 * @returns Lista de colecciones con estadísticas
 */
export const getCollections = async () => {
	try {
		logger.info('📚 Obteniendo colecciones');
		const collections = await getCollectionsAction();
		logger.info(`✅ ${collections.length} colecciones obtenidas`);
		return collections;
	} catch (error) {
		logger.error('❌ Error al obtener colecciones:', error);
		throw new CollectionServiceError('Error al obtener colecciones', 'GET_COLLECTIONS_FAILED', error);
	}
};

/**
 * Obtiene una colección por su ID
 * @param id ID de la colección
 * @returns Detalles de la colección
 */
export const getCollection = async (id: string): Promise<CollectionExtended> => {
	try {
		logger.info(`🔍 Buscando colección: ${id}`);
		const collection = await getCollectionAction(id);

		if (!collection) {
			throw new CollectionServiceError(`Colección no encontrada: ${id}`, 'COLLECTION_NOT_FOUND');
		}

		logger.info(`✅ Colección encontrada: ${collection.name}`);
		return collection;
	} catch (error) {
		logger.error(`❌ Error al obtener colección ${id}:`, error);
		throw new CollectionServiceError(
			`Error al obtener colección: ${error instanceof Error ? error.message : String(error)}`,
			'GET_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Crea una nueva colección
 * @param data Datos para la creación de la colección
 * @returns La colección creada
 */
export const createCollection = async (data: CreateCollectionData): Promise<CollectionExtended> => {
	try {
		logger.info('✨ Creando nueva colección:', { name: data.name });

		const collection = await createCollectionAction(data);

		// Notificar creación
		await notifyCollectionChange('create', collection);

		logger.info(`✅ Colección creada: ${collection.name}`, { id: collection.id });
		return collection;
	} catch (error) {
		logger.error('❌ Error al crear colección:', error);
		throw new CollectionServiceError(
			`Error al crear colección: ${error instanceof Error ? error.message : String(error)}`,
			'CREATE_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Actualiza una colección existente
 * @param id ID de la colección
 * @param data Datos a actualizar
 * @returns La colección actualizada
 */
export const updateCollection = async (id: string, data: UpdateCollectionData): Promise<CollectionExtended> => {
	try {
		logger.info(`📝 Actualizando colección: ${id}`);

		const collection = await updateCollectionAction(id, data);

		// Notificar actualización
		await notifyCollectionChange('update', collection);

		logger.info(`✅ Colección actualizada: ${collection.name}`, { id });
		return collection;
	} catch (error) {
		logger.error(`❌ Error al actualizar colección ${id}:`, error);
		throw new CollectionServiceError(
			`Error al actualizar colección: ${error instanceof Error ? error.message : String(error)}`,
			'UPDATE_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Elimina una colección
 * @param id ID de la colección a eliminar
 */
export const deleteCollection = async (id: string): Promise<void> => {
	try {
		logger.info(`🗑️ Eliminando colección: ${id}`);

		// Notificar antes de eliminar
		await notifyCollectionChange('delete', { id });

		await deleteCollectionAction(id);

		logger.info(`✅ Colección eliminada: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar colección ${id}:`, error);
		throw new CollectionServiceError(
			`Error al eliminar colección: ${error instanceof Error ? error.message : String(error)}`,
			'DELETE_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Obtiene las imágenes asociadas a una colección
 * @param id ID de la colección
 * @returns Lista de imágenes
 */
export const getCollectionImages = async (id: string): Promise<FileItem[]> => {
	try {
		logger.info(`🖼️ Obteniendo imágenes de la colección: ${id}`);
		const images = await getCollectionImagesAction(id);
		logger.info(`✅ ${images.length} imágenes obtenidas de la colección: ${id}`);
		return images;
	} catch (error) {
		logger.error(`❌ Error al obtener imágenes de la colección ${id}:`, error);
		throw new CollectionServiceError(
			`Error al obtener imágenes de la colección: ${error instanceof Error ? error.message : String(error)}`,
			'GET_COLLECTION_IMAGES_FAILED',
			error
		);
	}
};

/**
 * Añade una imagen a una colección
 * @param collectionId ID de la colección
 * @param imageId ID de la imagen
 */
export const addImageToCollection = async (collectionId: string, imageId: string): Promise<void> => {
	try {
		logger.info(`➕ Añadiendo imagen ${imageId} a la colección ${collectionId}`);

		await addImageToCollectionAction(collectionId, imageId);

		// Notificar cambio
		await notifyCollectionChange('items:add', { id: collectionId });

		logger.info(`✅ Imagen ${imageId} añadida a la colección ${collectionId}`);
	} catch (error) {
		logger.error('❌ Error al añadir imagen a la colección:', { collectionId, imageId, error });
		throw new CollectionServiceError(
			`Error al añadir imagen a la colección: ${error instanceof Error ? error.message : String(error)}`,
			'ADD_IMAGE_TO_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Elimina una imagen de una colección
 * @param collectionId ID de la colección
 * @param imageId ID de la imagen
 */
export const removeImageFromCollection = async (collectionId: string, imageId: string): Promise<void> => {
	try {
		logger.info(`➖ Eliminando imagen ${imageId} de la colección ${collectionId}`);

		await removeImageFromCollectionAction(collectionId, imageId);

		// Notificar cambio
		await notifyCollectionChange('items:remove', { id: collectionId });

		logger.info(`✅ Imagen ${imageId} eliminada de la colección ${collectionId}`);
	} catch (error) {
		logger.error('❌ Error al eliminar imagen de la colección:', { collectionId, imageId, error });
		throw new CollectionServiceError(
			`Error al eliminar imagen de la colección: ${error instanceof Error ? error.message : String(error)}`,
			'REMOVE_IMAGE_FROM_COLLECTION_FAILED',
			error
		);
	}
};
