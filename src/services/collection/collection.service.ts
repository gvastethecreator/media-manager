/**
 * @file Servicio para gestión de colecciones
 * @module services/collection
 * @description Servicio centralizado para operaciones CRUD y lógica de negocio de colecciones
 * @updated 2025-01-27
 */

// Drizzle imports
import { getPrismaClient } from '@/lib/database/db';
import { db } from '@/lib/drizzle';
import { collections } from '@/lib/drizzle/schema';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { revalidatePath } from '@/lib/server/revalidate';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import { toPrismaCollectionCreate, toPrismaCollectionUpdate } from '@/transformers/collection/serializers';
import { fromPrismaCollection, fromPrismaCollections } from '@/transformers/collection/transformer';
import type {
    CollectionBase,
    CollectionCreateInput,
    CollectionSearchOptions,
    CollectionUpdateInput,
    CollectionWithStats,
} from '@/types/entities/collection';
import { and, asc, desc, eq, like, or } from 'drizzle-orm';

// Logger específico para el servicio
const logger = serverLogger.withContext('CollectionService');

// Constantes del servicio
const REVALIDATE_PATHS = ['/collections', '/settings/collections'];

// Selección optimizada para obtener solo los conteos
const COLLECTION_SELECT_WITH_STATS = {
	id: true,
	name: true,
	emoji: true,
	color: true,
	description: true,
	shortcut: true,
	category: true,
	sortBy: true,
	filters: true,
	url: true,
	alternativeUrl: true,
	sourceImage: true,
	platform: true,
	price: true,
	network: true,
	tokenId: true,
	tokenAddress: true,
	contractAddress: true,
	contractType: true,
	editions: true,
	featuredImage: true,
	isFavorite: true,
	createdAt: true,
	updatedAt: true,
	_count: {
		select: {
			images: true,
			videos: true,
			albums: true,
			tags: true,
			characters: true,
			places: true,
			worldItems: true,
			concepts: true,
			prompts: true,
			notes: true,
			wildcards: true,
			properties: true,
			groups: true,
		},
	},
} as const;

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
 */
export const notifyCollectionChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	collection: CollectionBase | CollectionWithStats | { id: string }
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
 * Revalida las rutas de caché relacionadas con las colecciones
 */
const revalidateCollectionPaths = async (): Promise<void> => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
};

/**
 * Busca y obtiene colecciones según los criterios de búsqueda
 */
export const searchCollections = async (options: CollectionSearchOptions): Promise<CollectionWithStats[]> => {
	try {
		// **MIGRACIÓN A DRIZZLE**
		logger.info('🔍 Buscando colecciones', { options });

		// Construir condiciones de filtro
		const conditions: any[] = [];

		if (options.filters?.search) {
			conditions.push(
				or(
					like(collections.name, `%${options.filters.search}%`),
					like(collections.description, `%${options.filters.search}%`)
				)
			);
		}

		if (options.filters?.isFavorite !== undefined) {
			conditions.push(eq(collections.isFavorite, options.filters.isFavorite ? 1 : 0));
		}

		if (options.filters?.category && options.filters.category.length > 0) {
			const categoryConditions = options.filters.category.map(cat => eq(collections.category, cat));
			conditions.push(or(...categoryConditions));
		}

		// Construir query
		let query = db
			.select({
				id: collections.id,
				name: collections.name,
				emoji: collections.emoji,
				color: collections.color,
				description: collections.description,
				shortcut: collections.shortcut,
				category: collections.category,
				sortBy: collections.sortBy,
				filters: collections.filters,
				url: collections.url,
				alternativeUrl: collections.alternativeUrl,
				sourceImage: collections.sourceImage,
				platform: collections.platform,
				price: collections.price,
				network: collections.network,
				tokenId: collections.tokenId,
				tokenAddress: collections.tokenAddress,
				contractAddress: collections.contractAddress,
				contractType: collections.contractType,
				editions: collections.editions,
				featuredImage: collections.featuredImage,
				isFavorite: collections.isFavorite,
				createdAt: collections.createdAt,
				updatedAt: collections.updatedAt,
			})
			.from(collections);

		// Aplicar filtros
		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}

		// Aplicar ordenamiento
		const orderBy = options.orderBy || { createdAt: 'desc' };
		if (orderBy.createdAt) {
			query = query.orderBy(orderBy.createdAt === 'desc' ? desc(collections.createdAt) : asc(collections.createdAt));
		} else if (orderBy.name) {
			query = query.orderBy(orderBy.name === 'desc' ? desc(collections.name) : asc(collections.name));
		}

		// Aplicar paginación
		if (options.skip) {
			query = query.offset(options.skip);
		}
		if (options.take) {
			query = query.limit(options.take);
		}

		const drizzleCollections = await query;

		// Transformar a formato compatible con Prisma
		const transformedCollections = drizzleCollections.map((rawCollection) => ({
			...rawCollection,
			isFavorite: Boolean(rawCollection.isFavorite),
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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();

				// Construir query de Prisma para comparación
				const where: any = {};
				if (options.filters?.search) {
					where.OR = [
						{ name: { contains: options.filters.search } },
						{ description: { contains: options.filters.search } },
					];
				}
				if (options.filters?.isFavorite !== undefined) {
					where.isFavorite = options.filters.isFavorite;
				}
				if (options.filters?.category && options.filters.category.length > 0) {
					where.category = { in: options.filters.category };
				}

				const prismaCollections = await prisma.collection.findMany({
					where,
					select: COLLECTION_SELECT_WITH_STATS,
					skip: options.skip,
					take: options.take,
					orderBy: options.orderBy || { createdAt: 'desc' },
				});

				if (Math.abs(transformedCollections.length - prismaCollections.length) > 0) {
					logger.warn('⚠️ Diferencia en conteo searchCollections:', {
						drizzle: transformedCollections.length,
						prisma: prismaCollections.length
					});
				} else {
					logger.info('✅ Validación dual exitosa searchCollections:', {
						total: transformedCollections.length
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual searchCollections:', validationError);
			}
		}

		const result = fromPrismaCollections(transformedCollections as any);
		logger.info(`✅ ${result.length} colecciones encontradas`);
		return result;
	} catch (error) {
		logger.error('❌ Error al buscar colecciones', { error, options });
		throw new CollectionServiceError(
			`Error al buscar colecciones: ${error instanceof Error ? error.message : 'Error desconocido'}`,
			'SEARCH_COLLECTIONS_FAILED',
			error
		);
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
				shortcut: collections.shortcut,
				category: collections.category,
				sortBy: collections.sortBy,
				filters: collections.filters,
				url: collections.url,
				alternativeUrl: collections.alternativeUrl,
				sourceImage: collections.sourceImage,
				platform: collections.platform,
				price: collections.price,
				network: collections.network,
				tokenId: collections.tokenId,
				tokenAddress: collections.tokenAddress,
				contractAddress: collections.contractAddress,
				contractType: collections.contractType,
				editions: collections.editions,
				featuredImage: collections.featuredImage,
				isFavorite: collections.isFavorite,
				createdAt: collections.createdAt,
				updatedAt: collections.updatedAt,
			})
			.from(collections)
			.orderBy(desc(collections.createdAt));

		// Transformar a formato compatible con Prisma
		const transformedCollections = drizzleCollections.map((rawCollection) => ({
			...rawCollection,
			isFavorite: Boolean(rawCollection.isFavorite),
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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();

				const prismaCollections = await prisma.collection.findMany({
					select: COLLECTION_SELECT_WITH_STATS,
					orderBy: { createdAt: 'desc' },
				});

				if (Math.abs(transformedCollections.length - prismaCollections.length) > 0) {
					logger.warn('⚠️ Diferencia en conteo getCollections:', {
						drizzle: transformedCollections.length,
						prisma: prismaCollections.length
					});
				} else {
					logger.info('✅ Validación dual exitosa getCollections:', {
						total: transformedCollections.length
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual getCollections:', validationError);
			}
		}

		const result = fromPrismaCollections(transformedCollections as any);
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
				shortcut: collections.shortcut,
				category: collections.category,
				sortBy: collections.sortBy,
				filters: collections.filters,
				url: collections.url,
				alternativeUrl: collections.alternativeUrl,
				sourceImage: collections.sourceImage,
				platform: collections.platform,
				price: collections.price,
				network: collections.network,
				tokenId: collections.tokenId,
				tokenAddress: collections.tokenAddress,
				contractAddress: collections.contractAddress,
				contractType: collections.contractType,
				editions: collections.editions,
				featuredImage: collections.featuredImage,
				isFavorite: collections.isFavorite,
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

		// Transformar a formato compatible con Prisma
		const transformedCollection = {
			...rawCollection,
			isFavorite: Boolean(rawCollection.isFavorite),
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

		// **VALIDACIÓN DUAL EN DESARROLLO**
		if (process.env.NODE_ENV === 'development') {
			try {
				const prisma = await getPrismaClient();
				const prismaCollection = await prisma.collection.findUnique({
					where: { id },
					select: COLLECTION_SELECT_WITH_STATS,
				});

				if (prismaCollection && transformedCollection) {
					logger.info('✅ Validación dual exitosa getCollection:', {
						collectionName: transformedCollection.name
					});
				} else if (!prismaCollection && !transformedCollection) {
					logger.info('✅ Validación dual exitosa getCollection: ambos null');
				} else {
					logger.warn('⚠️ Diferencia en getCollection:', {
						drizzleFound: !!transformedCollection,
						prismaFound: !!prismaCollection
					});
				}
			} catch (validationError) {
				logger.error('❌ Error en validación dual getCollection:', validationError);
			}
		}

		const result = fromPrismaCollection(transformedCollection as any);
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
		const prisma = await getPrismaClient();

		const prismaData = toPrismaCollectionCreate(data);
		const newCollection = await prisma.collection.create({
			data: prismaData,
			select: COLLECTION_SELECT_WITH_STATS,
		});

		// Revalidar rutas
		await revalidateCollectionPaths();

		const result = fromPrismaCollection(newCollection);
		if (!result) {
			throw new CollectionServiceError('Error al transformar la colección recién creada', 'TRANSFORM_FAILED');
		}

		// Notificar creación
		await notifyCollectionChange('create', result);

		logger.info(`✅ Colección creada exitosamente: ${result.name}`, { id: result.id });
		return result;
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
		const prisma = await getPrismaClient();

		const prismaData = toPrismaCollectionUpdate(data);
		const updatedCollection = await prisma.collection.update({
			where: { id },
			data: prismaData,
			select: COLLECTION_SELECT_WITH_STATS,
		});

		// Revalidar rutas
		await revalidateCollectionPaths();
		revalidatePath(`/collections/${id}`);

		const result = fromPrismaCollection(updatedCollection);
		if (!result) {
			throw new CollectionServiceError('Error al transformar la colección actualizada', 'TRANSFORM_FAILED');
		}

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
		const prisma = await getPrismaClient();

		// Notificar antes de eliminar
		await notifyCollectionChange('delete', { id });

		await prisma.collection.delete({
			where: { id },
		});

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
		const prisma = await getPrismaClient();

		const images = await prisma.image.findMany({
			where: {
				collections: {
					some: {
						id: id,
					},
				},
			},
			select: {
				id: true,
				name: true,
				path: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		logger.info(`✅ ${images.length} imágenes obtenidas de la colección: ${id}`);
		return images;
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
		const prisma = await getPrismaClient();

		// Obtener estado actual
		const currentCollection = await prisma.collection.findUnique({
			where: { id },
			select: { isFavorite: true },
		});

		if (!currentCollection) {
			throw new CollectionServiceError('Colección no encontrada', 'COLLECTION_NOT_FOUND');
		}

		const updatedCollection = await prisma.collection.update({
			where: { id },
			data: { isFavorite: !currentCollection.isFavorite },
			select: COLLECTION_SELECT_WITH_STATS,
		});

		// Revalidar rutas
		await revalidateCollectionPaths();
		revalidatePath(`/collections/${id}`);

		const result = fromPrismaCollection(updatedCollection);
		if (!result) {
			throw new CollectionServiceError('Error al transformar la colección', 'TRANSFORM_FAILED');
		}

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

// Servicio principal
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
