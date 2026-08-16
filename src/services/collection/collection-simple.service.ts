/**
 * @file Servicio SIMPLIFICADO para colecciones (temporal para migración Drizzle)
 */

import { desc } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { collections } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { favoriteService } from '@/services/favorite/favorite.service';
import type { CollectionWithStats } from '@/types/entities/collection';
import { FavoriteEntityType } from '@/types/entities/favorite';

const logger = serverLogger.withContext('CollectionService');

/**
 * Obtiene todas las colecciones de forma simplificada
 */
export const getCollections = async (): Promise<CollectionWithStats[]> => {
	try {
		logger.info('📚 Obteniendo todas las colecciones');

		const favoriteEntityIds = await favoriteService.getFavoriteEntityIdsOrEmpty(FavoriteEntityType.COLLECTION);
		const favoriteIdSet = new Set(favoriteEntityIds);
		const drizzleCollections = await db.select().from(collections).orderBy(desc(collections.createdAt));

		const result = drizzleCollections.map((collection: any) => ({
			...collection,
			isFavorite: favoriteIdSet.has(collection.id),
			stats: {
				imageCount: collection.totalImages || 0,
				videoCount: collection.totalVideos || 0,
				albumCount: 0,
				tagCount: 0,
				characterCount: 0,
				placeCount: 0,
				worldItemCount: 0,
				conceptCount: 0,
				promptCount: 0,
				noteCount: 0,
				wildcardCount: 0,
				propertyCount: 0,
				groupCount: 0,
			},
		})) as CollectionWithStats[];

		logger.info(`✅ ${result.length} colecciones obtenidas`);
		return result;
	} catch (error) {
		logger.error('❌ Could not get collections', { error });
		return [];
	}
};
