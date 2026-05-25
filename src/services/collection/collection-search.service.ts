/**
 * @file Servicio de búsqueda de colecciones
 * @module services/collection/collection-search
 * @description Lógica de búsqueda y filtrado complejo de colecciones
 */

import { and, asc, desc, eq, inArray, like, notInArray, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { collections } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import { fromDrizzleCollection } from '@/transformers/collection/transformer';
import type { CollectionSearchOptions, CollectionWithStats } from '@/types/entities/collection';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { CollectionServiceError } from './collection-errors';

const logger = serverLogger.withContext('CollectionSearch');

/**
 * Busca y obtiene colecciones según los criterios de búsqueda
 */
export const searchCollections = async (options: CollectionSearchOptions): Promise<CollectionWithStats[]> => {
	try {
		logger.info('🔍 Buscando colecciones', { options });

		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(FavoriteEntityType.COLLECTION);
		const favoriteIdSet = favoriteEntityIds ? new Set(favoriteEntityIds) : null;

		// Construir condiciones de filtro
		const conditions: any[] = [];

		if (options.where?.search) {
			conditions.push(
				or(
					like(collections.name, `%${options.where.search}%`),
					like(collections.description, `%${options.where.search}%`)
				)
			);
		}

		if (options.where?.isFavorite !== undefined) {
			if (favoriteEntityIds === null) {
				conditions.push(eq(collections.isFavorite, Boolean(options.where.isFavorite)));
			} else if (options.where.isFavorite) {
				if (favoriteEntityIds.length === 0) {
					return [];
				}

				conditions.push(inArray(collections.id, favoriteEntityIds));
			} else if (favoriteEntityIds.length > 0) {
				conditions.push(notInArray(collections.id, favoriteEntityIds));
			}
		}

		// Nota: La tabla collections no tiene campo category, se omite este filtro

		// Construir query
		let query = db
			.select({
				id: collections.id,
				name: collections.name,
				description: collections.description,
				emoji: collections.emoji,
				color: collections.color,
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

		const transformedCollections = drizzleCollections.map((rawCollection: any) => ({
			...rawCollection,
			isFavorite: favoriteIdSet === null ? Boolean(rawCollection.isFavorite) : favoriteIdSet.has(rawCollection.id),
			// totalImages: 0, // TODO: get from EntityAggregates
			// totalVideos: 0, // TODO: get from EntityAggregates
			// totalSize: 0, // TODO: get from EntityAggregates
			lastImageAddedAt: rawCollection.lastImageAddedAt || null,
			lastVideoAddedAt: rawCollection.lastVideoAddedAt || null,
		}));

		// Transformar usando el transformer correcto
		const result = transformedCollections
			.map((collection: any) => fromDrizzleCollection(collection, collection._count))
			.filter((c: CollectionWithStats | null): c is CollectionWithStats => c !== null);

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
