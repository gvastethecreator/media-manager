/**
 * @file Servicio para gestión de colecciones
 * @module services/collection
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de colecciones
 * @updated 2025-01-27
 */

import * as crypto from 'crypto';
import { desc, eq } from 'drizzle-orm';
// Drizzle imports
import { db } from '@/lib/drizzle';
import { collections, imageCollections, images } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { revalidatePath } from '@/lib/server/revalidate';
import { recomputeAggregatesForCollection } from '@/server/services/aggregates.service';
import { fromDrizzleCollection, fromDrizzleCollections } from '@/transformers/collection/transformer';
import type { CollectionCreateInput, CollectionUpdateInput, CollectionWithStats } from '@/types/entities/collection';
import { CollectionServiceError } from './collection-errors';
import { COLLECTION_EVENTS, notifyCollectionChange } from './collection-events';
import { searchCollections } from './collection-search.service';

// Re-exports para compatibilidad backward
export { CollectionServiceError, createCollectionError } from './collection-errors';
export { COLLECTION_EVENTS, notifyCollectionChange } from './collection-events';
export { searchCollections } from './collection-search.service';

// Logger específico para el servicio
const logger = serverLogger.withContext('CollectionService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/collections', '/settings/collections'];

/**
 * Revalida las rutas de caché relacionadas con las colecciones
 */
const revalidateCollectionPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
};

/**
 * Obtiene todas las colecciones
 */
export const getCollections = async (): Promise<CollectionWithStats[]> => {
	try {
		// **MIGRACIÓN A DRIZZLE**
		logger.info('📚 Obteniendo todas las colecciones');

		const drizzleCollections = await db
			.select({
				id: collections.id,
				name: collections.name,
				emoji: collections.emoji,
				color: collections.color,
				description: collections.description,
				featuredImage: collections.featuredImage,

				isFavorite: collections.isFavorite,
				// totalImages: moved to EntityAggregates
				// totalVideos: moved to EntityAggregates
				// totalSize: moved to EntityAggregates
				lastImageAddedAt: collections.lastImageAddedAt,
				lastVideoAddedAt: collections.lastVideoAddedAt,
				parentId: collections.parentId,
				createdAt: collections.createdAt,
				updatedAt: collections.updatedAt,
			})
			.from(collections)
			.orderBy(desc(collections.createdAt));

		const transformedCollections = drizzleCollections.map((rawCollection: any) => ({
			...rawCollection,
			isFavorite: Boolean(rawCollection.isFavorite),
			// totalImages: 0, // TODO: get from EntityAggregates
			// totalVideos: 0, // TODO: get from EntityAggregates
			// totalSize: 0, // TODO: get from EntityAggregates
			lastImageAddedAt: rawCollection.lastImageAddedAt || null,
			lastVideoAddedAt: rawCollection.lastVideoAddedAt || null,
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		}));

		const collectionsWithCounts = transformedCollections.map((collection: any) => ({
			collection,
			counts: collection._count,
		}));
		const result = fromDrizzleCollections(collectionsWithCounts);
		logger.info(`✅ ${result.length} colecciones obtenidas`);
		return result;
	} catch (error) {
		logger.error('❌ Error al obtener colecciones', { error });
		throw new CollectionServiceError(
			`Error al obtener colecciones: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_COLLECTIONS_FAILED',
			error
		);
	}
};

/**
 * Obtiene una colección por su ID
 */
export const getCollection = async (id: string): Promise<CollectionWithStats | null> => {
	try {
		// **MIGRACIÓN A DRIZZLE**
		logger.info(`🔍 Obteniendo colección por ID: ${id}`);

		const drizzleCollection = await db
			.select({
				id: collections.id,
				name: collections.name,
				emoji: collections.emoji,
				color: collections.color,
				description: collections.description,
				featuredImage: collections.featuredImage,

				isFavorite: collections.isFavorite,
				// totalImages: moved to EntityAggregates
				// totalVideos: moved to EntityAggregates
				// totalSize: moved to EntityAggregates
				lastImageAddedAt: collections.lastImageAddedAt,
				lastVideoAddedAt: collections.lastVideoAddedAt,
				parentId: collections.parentId,
				createdAt: collections.createdAt,
				updatedAt: collections.updatedAt,
			})
			.from(collections)
			.where(eq(collections.id, id))
			.limit(1);

		if (drizzleCollection.length === 0) {
			logger.warn(`Colección no encontrada: ${id}`);
			return null;
		}

		const rawCollection = drizzleCollection[0];

		const transformedCollection = {
			...rawCollection,
			isFavorite: Boolean(rawCollection.isFavorite),
			// totalImages: 0, // TODO: get from EntityAggregates
			// totalVideos: 0, // TODO: get from EntityAggregates
			// totalSize: 0, // TODO: get from EntityAggregates
			lastImageAddedAt: rawCollection.lastImageAddedAt || null,
			lastVideoAddedAt: rawCollection.lastVideoAddedAt || null,
			// Counts vacíos por ahora (TODO: implementar subqueries)
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		const result = fromDrizzleCollection(transformedCollection as any, transformedCollection._count);
		if (!result) {
			throw new CollectionServiceError('Error al transformar la colección', 'TRANSFORM_FAILED');
		}

		logger.info(`✅ Colección encontrada: ${result.name}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al obtener colección ${id}`, { error });
		throw new CollectionServiceError(
			`Error al obtener colección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Crea una nueva colección
 */
export const createCollection = async (data: CollectionCreateInput): Promise<CollectionWithStats> => {
	try {
		logger.info('✨ Creando nueva colección', { name: data.name });

		// **MIGRACIÓN A DRIZZLE**
		const result = await db
			.insert(collections)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				emoji: data.emoji || '📋',
				color: data.color || '#3b82f6',
				description: data.description || null,
				category: data.category || null,
				url: data.url || null,
				alternativeUrl: data.alternativeUrl || null,
				sourceImage: data.sourceImage || null,
				platform: data.platform || null,
				price: data.price || null,
				network: data.network || null,
				tokenId: data.tokenId || null,
				editions: data.editions || null,
				featuredImage: data.featuredImage || null,
				isFavorite: data.isFavorite,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const newCollection = result[0];

		// Transformar a formato compatible
		const transformedCollection = {
			...newCollection,
			isFavorite: Boolean(newCollection.isFavorite),
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Revalidar rutas
		await revalidateCollectionPaths();

		// Recalcular agregados genéricos (no bloqueante)
		recomputeAggregatesForCollection(newCollection.id).catch((err) =>
			logger.warn('No se pudo recalcular agregados de colección tras crear', { err, id: newCollection.id })
		);

		const collectionWithStats = fromDrizzleCollection(transformedCollection as any, {
			images: 0,
			videos: 0,
			albums: 0,
			tags: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		});
		if (!collectionWithStats) {
			throw new CollectionServiceError('Error al transformar la colección recién creada', 'TRANSFORM_FAILED');
		}

		// Notificar creación
		await notifyCollectionChange('create', collectionWithStats);

		logger.info(`✅ Colección creada exitosamente: ${collectionWithStats.name}`, { id: collectionWithStats.id });
		return collectionWithStats;
	} catch (error) {
		logger.error('❌ Error al crear colección', { error, data });
		throw new CollectionServiceError(
			`Error al crear colección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'CREATE_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Actualiza una colección existente
 */
export const updateCollection = async (id: string, data: CollectionUpdateInput): Promise<CollectionWithStats> => {
	try {
		logger.info(`📝 Actualizando colección: ${id}`);

		const [updatedCollection] = await db
			.update(collections)
			.set({
				name: data.name,
				emoji: data.emoji || '📋',
				color: data.color || '#3b82f6',
				description: data.description || null,
				category: data.category || null,
				url: data.url || null,
				alternativeUrl: data.alternativeUrl || null,
				sourceImage: data.sourceImage || null,
				platform: data.platform || null,
				price: data.price || null,
				network: data.network || null,
				tokenId: data.tokenId || null,
				editions: data.editions || null,
				featuredImage: data.featuredImage || null,
				isFavorite: data.isFavorite,
				updatedAt: new Date(),
			})
			.where(eq(collections.id, id))
			.returning();

		if (!updatedCollection) {
			throw new CollectionServiceError('Colección no encontrada', 'COLLECTION_NOT_FOUND');
		}

		// Revalidar rutas
		await revalidateCollectionPaths();
		revalidatePath(`/collections/${id}`);

		// Recalcular agregados (no bloqueante)
		recomputeAggregatesForCollection(id).catch((err) =>
			logger.warn('No se pudo recalcular agregados de colección tras actualizar', { err, id })
		);

		const result: CollectionWithStats = {
			...updatedCollection,
			isFavorite: Boolean(updatedCollection.isFavorite),
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Notificar actualización
		await notifyCollectionChange('update', result);

		logger.info(`✅ Colección actualizada exitosamente: ${result.name}`, { id });
		return result;
	} catch (error) {
		logger.error(`❌ Error al actualizar colección ${id}`, { error, data });
		throw new CollectionServiceError(
			`Error al actualizar colección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'UPDATE_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Elimina una colección
 */
export const deleteCollection = async (id: string): Promise<void> => {
	try {
		logger.info(`🗑️ Eliminando colección: ${id}`);

		// Notificar antes de eliminar
		await notifyCollectionChange('delete', { id });

		await db.delete(collections).where(eq(collections.id, id));

		// Revalidar rutas
		await revalidateCollectionPaths();

		logger.info(`✅ Colección eliminada exitosamente: ${id}`);
	} catch (error) {
		logger.error(`❌ Error al eliminar colección ${id}`, { error });
		throw new CollectionServiceError(
			`Error al eliminar colección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'DELETE_COLLECTION_FAILED',
			error
		);
	}
};

/**
 * Obtiene las imágenes asociadas a una colección
 */
export const getCollectionImages = async (id: string): Promise<{ id: string; name: string; path: string }[]> => {
	try {
		logger.info(`🖼️ Obteniendo imágenes de la colección: ${id}`);

		const result = await db
			.select({
				id: images.id,
				name: images.name,
				path: images.path,
			})
			.from(images)
			.innerJoin(imageCollections, eq(images.id, imageCollections.A))
			.innerJoin(collections, eq(imageCollections.B, collections.id))
			.where(eq(collections.id, id))
			.orderBy(desc(images.createdAt));

		logger.info(`✅ ${result.length} imágenes obtenidas de la colección: ${id}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al obtener imágenes de la colección ${id}`, { error });
		throw new CollectionServiceError(
			`Error al obtener imágenes de la colección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'GET_COLLECTION_IMAGES_FAILED',
			error
		);
	}
};

/**
 * Cambia el estado de favorito de una colección
 */
export const toggleCollectionFavorite = async (id: string): Promise<CollectionWithStats> => {
	try {
		logger.info(`⭐ Cambiando estado de favorito de la colección: ${id}`);

		// Obtener estado actual
		const currentCollection = await db.query.collections.findFirst({
			where: eq(collections.id, id),
			columns: { isFavorite: true },
		});

		if (!currentCollection) {
			throw new CollectionServiceError('Colección no encontrada', 'COLLECTION_NOT_FOUND');
		}

		const [updatedCollection] = await db
			.update(collections)
			.set({
				isFavorite: !currentCollection.isFavorite,
			})
			.where(eq(collections.id, id))
			.returning();

		if (!updatedCollection) {
			throw new CollectionServiceError('Error al actualizar la colección', 'UPDATE_FAILED');
		}

		// Revalidar rutas
		await revalidateCollectionPaths();
		revalidatePath(`/collections/${id}`);

		const result: CollectionWithStats = {
			...updatedCollection,
			isFavorite: Boolean(updatedCollection.isFavorite),
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Notificar actualización
		await notifyCollectionChange('update', result);

		logger.info(`✅ Estado de favorito cambiado: ${id} -> ${result.isFavorite}`);
		return result;
	} catch (error) {
		logger.error(`❌ Error al cambiar estado de favorito de la colección ${id}`, { error });
		throw new CollectionServiceError(
			`Error al cambiar estado de favorito: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'TOGGLE_FAVORITE_FAILED',
			error
		);
	}
};

/**
 * Clase de servicio para gestión de colecciones
 */
export class CollectionService {
	async getCollections(_filters?: any): Promise<{ collections: CollectionWithStats[]; total: number }> {
		const collections = await getCollections();
		return { collections, total: collections.length };
	}

	async getCollectionById(id: string): Promise<CollectionWithStats | null> {
		return await getCollection(id);
	}

	async createCollection(data: CollectionCreateInput): Promise<CollectionWithStats> {
		return await createCollection(data);
	}

	async updateCollection(id: string, data: CollectionUpdateInput): Promise<CollectionWithStats | null> {
		try {
			return await updateCollection(id, data);
		} catch (error) {
			if (error instanceof CollectionServiceError && error.code === 'COLLECTION_NOT_FOUND') {
				return null;
			}
			throw error;
		}
	}

	async deleteCollection(id: string): Promise<boolean> {
		try {
			await deleteCollection(id);
			return true;
		} catch (error) {
			if (error instanceof CollectionServiceError && error.code === 'COLLECTION_NOT_FOUND') {
				return false;
			}
			throw error;
		}
	}

	async getCollectionImages(id: string): Promise<{ id: string; name: string; path: string }[]> {
		return await getCollectionImages(id);
	}

	async toggleFavorite(id: string): Promise<CollectionWithStats> {
		return await toggleCollectionFavorite(id);
	}

	async addImageToCollection(collectionId: string, imageId: string): Promise<void> {
		// TODO: Implementar lógica para agregar imagen a colección
		logger.info(`Agregando imagen ${imageId} a colección ${collectionId}`);
	}

	async removeImageFromCollection(collectionId: string, imageId: string): Promise<void> {
		// TODO: Implementar lógica para remover imagen de colección
		logger.info(`Removiendo imagen ${imageId} de colección ${collectionId}`);
	}

	async getRecentCollectionMedia(id: string, limit: number): Promise<any[]> {
		// TODO: Implementar lógica para obtener media reciente
		logger.info(`Obteniendo media reciente de colección ${id} (limit: ${limit})`);
		return [];
	}
}

// Servicio principal (legacy)
const collectionService = {
	searchCollections,
	getCollections,
	getCollection,
	createCollection,
	updateCollection,
	deleteCollection,
	getCollectionImages,
	toggleCollectionFavorite,
	notifyCollectionChange,
	COLLECTION_EVENTS,
	CollectionServiceError,
};

export default collectionService;
